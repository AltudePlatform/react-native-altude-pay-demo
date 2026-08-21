/**
 * Solana wallet and RPC utilities.
 */
import {WalletInfo, BalanceResponse, TransactionStatusResponse} from '../types';
import {stableCoinMint} from '../config/paymentConfig';
import {ALTUDE_NETWORK} from '../config/apiConfig';
import {runtimeConfig} from '../config/runtimeConfig';
type Commitment = 'processed' | 'confirmed' | 'finalized';


export interface TransactionSummary {
  signature: string;
  slot: number;
  blockTime: number | null;
  status: 'success' | 'failed';
  type: 'send' | 'receive' | 'unknown';
  amount: number;
  mint?: string;
  from?: string;
  to?: string;
}

export {isValidSolanaAddress, truncateAddress} from '../utils/helpers';

export const STABLE_COIN_MINT = stableCoinMint;
export const USDC_DEVNET_MINT = STABLE_COIN_MINT;

const COMMITMENT: Commitment = 'confirmed';
const DEFAULT_RPC_URL = 'https://api.devnet.solana.com';
const rpcByUrl = new Map<string, any>();
type CryptoWithRandomValues = {
  getRandomValues?: (...args: any[]) => unknown;
};
let cryptoRandomValuesPromise: Promise<void> | null = null;

export async function getAccountHistory(
  walletAddress: string,
  limit: number,
  _page: number,
): Promise<TransactionSummary[]> {
  const rpc = await getRpc(DEFAULT_RPC_URL);
  const {address} = await loadKit();

  const signatures: Array<{signature: string}> = await rpc
    .getSignaturesForAddress(address(walletAddress), {limit})
    .send();

  const transactions = await Promise.all(
    signatures.map(async sigInfo => {
      try {
        const tx = await fetchTransaction(rpc, sigInfo.signature);

        if (!tx) {
          return null;
        }

        return summarizeTransaction(
          tx,
          sigInfo.signature,
          walletAddress,
        );
      } catch (error) {
        console.error(
          `[solana] Error fetching ${sigInfo.signature}:`,
          error,
        );

        return null;
      }
    }),
  );

  return transactions.filter(
    (tx): tx is TransactionSummary => tx !== null,
  );
}

export async function getSignatureHistory( 
  walletAddress: string,
  signature: string,
): Promise<TransactionSummary | null> {
  const rpc = await getRpc(DEFAULT_RPC_URL);

  try {
    const tx = await fetchTransaction(rpc, signature);

    if (!tx) {
      return null;
    }

    return summarizeTransaction(
      tx,
      signature,
      walletAddress,
    );
  } catch (error) {
    console.error(
      `[solana] Error fetching ${signature}:`,
      error,
    );

    return null;
  }

 
}

/**
 * Gets the SOL balance change for the wallet.
 *
 * This is only used as a fallback for SOL transactions.
 * SPL token transfers are handled separately using
 * preTokenBalances/postTokenBalances.
 */
function getWalletBalanceChange(
  tx: any,
  walletAddress: string,
): number {
  const { meta } = tx;

  if (!meta) {
    return 0;
  }

  const accountKeys: string[] = tx.transaction?.message?.accountKeys ?? [];

  const index = accountKeys.indexOf(walletAddress);

  if (index === -1) {
    return 0;
  }

  return (
    Number(meta.postBalances?.[index] ?? 0) -
    Number(meta.preBalances?.[index] ?? 0)
  );
}

/**
 * Finds an SPL token balance change involving the wallet.
 */
function getTokenTransfer(
  tx: any,
  walletAddress: string,
): {
  amount: number;
  mint: string;
  type: 'send' | 'receive';
  from?: string;
  to?: string;
} | null {
  const meta = tx.meta;

  if (!meta) {
    return null;
  }

  const preTokenBalances = meta.preTokenBalances ?? [];
  const postTokenBalances = meta.postTokenBalances ?? [];

  if (
    preTokenBalances.length === 0 &&
    postTokenBalances.length === 0
  ) {
    return null;
  }

  /**
   * Combine pre/post balances using:
   *
   * accountIndex + mint
   *
   * because a token account may only appear in pre OR post
   * when it was created during this transaction.
   */
  const balances = new Map<
    string,
    {
      accountIndex: number;
      mint: string;
      owner: string;
      preAmount: number;
      postAmount: number;
    }
  >();

  for (const item of preTokenBalances) {
    const key = `${item.accountIndex}:${item.mint}`;

    balances.set(key, {
      accountIndex: item.accountIndex,
      mint: item.mint,
      owner: item.owner ?? '',
      preAmount: Number(item.uiTokenAmount.uiAmount ?? 0),
      postAmount: 0,
    });
  }

  for (const item of postTokenBalances) {
    const key = `${item.accountIndex}:${item.mint}`;

    const existing = balances.get(key);

    if (existing) {
      existing.postAmount = Number(
        item.uiTokenAmount.uiAmount ?? 0,
      );
    } else {
      balances.set(key, {
        accountIndex: item.accountIndex,
        mint: item.mint,
        owner: item.owner ?? '',
        preAmount: 0,
        postAmount: Number(
          item.uiTokenAmount.uiAmount ?? 0,
        ),
      });
    }
  }

  const changes = Array.from(balances.values())
    .map(item => ({
      ...item,
      change: item.postAmount - item.preAmount,
    }))
    .filter(item => item.change !== 0);

  /**
   * Find the token balance belonging to our wallet.
   */
  const walletChange = changes.find(
    item => item.owner === walletAddress,
  );

  if (!walletChange) {
    return null;
  }

  /**
   * Find the opposite token movement.
   *
   * Example:
   *
   * Wallet A: -10 USDC
   * Wallet B: +10 USDC
   */
  const counterparty = changes.find(
    item =>
      item.mint === walletChange.mint &&
      item.owner !== walletAddress &&
      Math.sign(item.change) !==
        Math.sign(walletChange.change),
  );

  const isSend = walletChange.change < 0;

  return {
    amount: Math.abs(walletChange.change),
    mint: walletChange.mint,
    type: isSend ? 'send' : 'receive',

    from: isSend
      ? walletAddress
      : counterparty?.owner,

    to: isSend
      ? counterparty?.owner
      : walletAddress,
  };
}

/**
 * Creates the UI-friendly transaction summary.
 *
 * Priority:
 *
 * 1. SPL token transfer
 * 2. SOL balance change
 */
function summarizeTransaction(
  tx: any,
  signature: string,
  walletAddress: string,
): TransactionSummary {
  const meta = tx.meta;
  console.log('[solana] Summarizing transaction:', signature, tx);
  /**
   * First check for an SPL token transfer.
   */
  const tokenTransfer = getTokenTransfer(
    tx,
    walletAddress,
  );

  if (tokenTransfer) {
    return {
      signature,
      slot: Number(tx.slot),
      blockTime: tx.blockTime === null || tx.blockTime === undefined
        ? null
        : Number(tx.blockTime),
      status: meta?.err
        ? 'failed'
        : 'success',

      type: tokenTransfer.type,
      amount: tokenTransfer.amount,
      mint: tokenTransfer.mint,
      from: tokenTransfer.from,
      to: tokenTransfer.to,
    };
  }

  /**
   * Otherwise treat it as a SOL transaction.
   */
  const change = getWalletBalanceChange(
    tx,
    walletAddress,
  );

  let type: TransactionSummary['type'] = 'unknown';

  if (change > 0) {
    type = 'receive';
  } else if (change < 0) {
    type = 'send';
  }

  return {
    signature,
    slot: Number(tx.slot),
    blockTime: tx.blockTime === null || tx.blockTime === undefined
      ? null
      : Number(tx.blockTime),
    status: meta?.err
      ? 'failed'
      : 'success',

    type,
    amount: Math.abs(change) / 1_000_000_000,

    from:
      type === 'send'
        ? walletAddress
        : undefined,

    to:
      type === 'receive'
        ? walletAddress
        : undefined,
  };
}

async function ensureCryptoRandomValues(): Promise<void> {
  const crypto = (globalThis as typeof globalThis & {
    crypto?: CryptoWithRandomValues;
  }).crypto;

  if (typeof crypto?.getRandomValues === 'function') {
    return;
  }

  if (!cryptoRandomValuesPromise) {
    cryptoRandomValuesPromise = Promise.resolve().then(() => {
      require('react-native-get-random-values');
    });
  }

  await cryptoRandomValuesPromise;
}

async function loadKit(): Promise<any> {
  try {
    return require('@solana/kit');
  } catch {
    return await import('@solana/kit');
  }
}

async function loadTokenProgram(): Promise<any> {
  try {
    return require('@solana-program/token');
  } catch {
    return await import('@solana-program/token');
  }
}

async function getRpc(rpcUrl = DEFAULT_RPC_URL): Promise<any> {
  const cached = rpcByUrl.get(rpcUrl);
  if (cached) {return cached;}
  const {createSolanaRpc} = await loadKit();
  const next = createSolanaRpc(rpcUrl);
  rpcByUrl.set(rpcUrl, next);
  return next;
}

async function fetchTransaction(rpc: any, txSignature: string): Promise<any> {
  return rpc
    .getTransaction(txSignature, {
      commitment: COMMITMENT,
      encoding: 'json',
      maxSupportedTransactionVersion: 0,
    })
    .send();
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {throw new Error('Invalid hex length');}
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Generate a new Solana wallet using the supported Altude Core SDK entrypoint. */
export async function generateDemoWallet(): Promise<WalletInfo> {
  await ensureCryptoRandomValues();

  const {deriveSolanaKeypair, generateMnemonic} =
    require('@altude/core') as typeof import('@altude/core');
  const {base58} = require('@scure/base') as typeof import('@scure/base');
  const mnemonic = generateMnemonic(12);
  const keypair = await deriveSolanaKeypair(mnemonic, 0);

  return {
    publicKey: base58.encode(keypair.publicKey),
    privateKey: bytesToHex(keypair.privateKey),
  };
}

/** Build a GaslessTransactionSigner from the hex private key stored in WalletInfo. */
export function buildSigner(wallet: WalletInfo) {
  const privateKeyBytes = hexToBytes(wallet.privateKey);
  return {
    address: wallet.publicKey,
    async signTransactionMessage(txBytes: Uint8Array): Promise<Uint8Array> {
      const {ed25519} = await import('@noble/curves/ed25519.js');
      return ed25519.sign(txBytes, privateKeyBytes);
    },
  };
}

export interface DevnetTokenAccountBootstrapResult {
  wallet: WalletInfo;
  tokenAccountAddress: string;
  mint: string;
  created: boolean;
  error?: string;
}

export interface DevnetTokenAccountOptions {
  skipFunding?: boolean;
  strict?: boolean;
}

async function confirmSignature(
  rpc: any,
  txSignature: string,
  attempts = 20,
  delayMs = 1_000,
): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const {value} = await rpc
      .getSignatureStatuses([txSignature], {searchTransactionHistory: true})
      .send();
    const status = value?.[0];

    if (status?.err) {
      throw new Error(
        `Transaction ${txSignature} failed: ${JSON.stringify(status.err)}`,
      );
    }

    if (
      status?.confirmationStatus === 'confirmed' ||
      status?.confirmationStatus === 'finalized'
    ) {
      return;
    }

    await new Promise<void>(resolve => {
      setTimeout(() => resolve(), delayMs);
    });
  }

  throw new Error(`Timed out waiting for confirmation of ${txSignature}`);
}

async function ensureDevnetFunding(
  rpc: any,
  payerAddress: string,
): Promise<void> {
  const {lamports} = await loadKit();
  const {value: balance} = await rpc
    .getBalance(payerAddress, {commitment: COMMITMENT})
    .send();
  const minimumBalanceLamports = 50_000_000n;

  if (BigInt(balance) >= minimumBalanceLamports) {
    return;
  }

  const airdropSignature = await rpc
    .requestAirdrop(payerAddress, lamports(1_000_000_000n), {
      commitment: COMMITMENT,
    })
    .send();

  await confirmSignature(rpc, airdropSignature);
}

export async function createDevnetTokenAccount(
  wallet: WalletInfo,
  mint = STABLE_COIN_MINT,
  options?: DevnetTokenAccountOptions,
): Promise<DevnetTokenAccountBootstrapResult> {
  if (ALTUDE_NETWORK !== 'devnet') {
    throw new Error('Devnet token account creation is only supported on devnet');
  }

  const {
    address,
    appendTransactionMessageInstruction,
    createKeyPairSignerFromPrivateKeyBytes,
    createTransactionMessage,
    getBase64EncodedWireTransaction,
    getSignatureFromTransaction,
    pipe,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
  } = await loadKit();
  const {
    findAssociatedTokenPda,
    getCreateAssociatedTokenIdempotentInstruction,
    TOKEN_PROGRAM_ADDRESS,
  } = await loadTokenProgram();

  const rpc = await getRpc(DEFAULT_RPC_URL);
  const payer = await createKeyPairSignerFromPrivateKeyBytes(
    hexToBytes(wallet.privateKey),
  );
  const mintAddress = address(mint);
  const strict = options?.strict ?? false;

  const [ataAddress] = await findAssociatedTokenPda({
    mint: mintAddress,
    owner: payer.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  try {
    if (!options?.skipFunding) {
      await ensureDevnetFunding(rpc, payer.address);
    }

    const {value: latestBlockhash} = await rpc
      .getLatestBlockhash({commitment: COMMITMENT})
      .send();

    // Idempotent: succeeds whether or not the associated token account exists.
    const transactionMessage = pipe(
      createTransactionMessage({version: 0}),
      (message: any) => setTransactionMessageFeePayerSigner(payer, message),
      (message: any) =>
        setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
      (message: any) =>
        appendTransactionMessageInstruction(
          getCreateAssociatedTokenIdempotentInstruction({
            payer,
            ata: ataAddress,
            owner: payer.address,
            mint: mintAddress,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
          }),
          message,
        ),
    );

    const signedTransaction = await signTransactionMessageWithSigners(
      transactionMessage,
    );
    const txSignature = getSignatureFromTransaction(signedTransaction);

    await rpc
      .sendTransaction(getBase64EncodedWireTransaction(signedTransaction), {
        encoding: 'base64',
        preflightCommitment: COMMITMENT,
      })
      .send();

    await confirmSignature(rpc, txSignature);

    return {
      wallet,
      tokenAccountAddress: ataAddress,
      mint,
      created: true,
    };
  } catch (error) {
    if (strict) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.warn('[solana] createDevnetTokenAccount best-effort fallback:', message);

    return {
      wallet,
      tokenAccountAddress: ataAddress,
      mint,
      created: false,
      error: message,
    };
  }
}

function parsePaymentTokenBalance(balance: unknown): number {
  if (!balance || typeof balance !== 'object') {
    return 0;
  }

  const response = balance as {
    uiAmount?: unknown;
    TokenInfos?: Array<{
      Account?: {
        Data?: {
          Parsed?: {
            Info?: {
              TokenAmount?: {
                Amount?: unknown;
                Decimals?: unknown;
              };
            };
          };
        };
      };
    }>;
  };
  const tokenAmount =
    response.TokenInfos?.[0]?.Account?.Data?.Parsed?.Info?.TokenAmount;

  if (tokenAmount?.Amount !== undefined) {
    const rawAmount = Number(tokenAmount.Amount);
    const decimals = Number(tokenAmount.Decimals ?? 0);
    if (Number.isFinite(rawAmount) && Number.isInteger(decimals) && decimals >= 0) {
      return rawAmount / 10 ** decimals;
    }
  }

  const uiAmount = Number(response.uiAmount);
  return Number.isFinite(uiAmount) ? uiAmount : 0;
}

/** Fetch the payment token balance through the Gas Station SDK. */
export async function getWalletBalances(
  walletAddress: string,
): Promise<BalanceResponse> {
  if (runtimeConfig.useMockData) {
    return {
      walletAddress,
      solBalance: runtimeConfig.mock.solBalance,
      usdcBalance: runtimeConfig.mock.usdcBalance,
    };
  }

  const {getGasstation} = await import('./gasstationAdapter');
  const gasstation = await getGasstation();
  const account = await gasstation.getBalance({
    account: walletAddress,
    token: STABLE_COIN_MINT,
  });

  return {
    walletAddress,
    solBalance: 0,
    usdcBalance: parsePaymentTokenBalance(account),
  };
}

export async function getTransactionStatus(
  signature: string,
  rpcUrl?: string,
): Promise<TransactionStatusResponse> {
  if (runtimeConfig.useMockData || signature.startsWith('MOCK_SIG_')) {
    return {
      signature,
      status: 'confirmed',
      confirmed: true,
      slot: Math.floor(Date.now() / 1000),
    };
  }

  const rpc = await getRpc(rpcUrl ?? DEFAULT_RPC_URL);
  const statuses = await rpc
    .getSignatureStatuses([signature], {searchTransactionHistory: true})
    .send();
  const status = statuses.value?.[0];

  if (!status) {
    return {signature, status: 'pending', confirmed: false};
  }

  if (status.err) {
    return {
      signature,
      status: 'failed',
      confirmed: false,
      slot: Number(status.slot),
      error: JSON.stringify(status.err),
    };
  }

  const confirmed =
    status.confirmationStatus === 'confirmed' ||
    status.confirmationStatus === 'finalized';

  return {
    signature,
    status: confirmed ? 'confirmed' : 'pending',
    confirmed,
    slot: Number(status.slot),
  };
}

export async function waitForTransactionConfirmation(
  signature: string,
  attempts = 12,
  delayMs = 1_500,
  rpcUrl?: string,
): Promise<TransactionStatusResponse> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = await getTransactionStatus(signature, rpcUrl);
    if (status.status === 'confirmed' || status.status === 'failed') {
      return status;
    }

    if (attempt < attempts - 1) {
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), delayMs);
      });
    }
  }

  return {signature, status: 'pending', confirmed: false};
}
