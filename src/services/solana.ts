/**
 * Solana wallet and RPC utilities.
 *
 * Keep all crypto/RPC imports lazy to avoid freezing the app at startup while
 * Metro resolves the browser-oriented Solana and noble-hashes bundles on Android.
 */
import {WalletInfo, BalanceResponse, TransactionStatusResponse} from '../types';
import {stableCoinMint} from '../config/paymentConfig';
import {ALTUDE_NETWORK} from '../config/apiConfig';
import {runtimeConfig} from '../config/runtimeConfig';

type Commitment = 'processed' | 'confirmed' | 'finalized';

export {isValidSolanaAddress, truncateAddress} from '../utils/helpers';

export const STABLE_COIN_MINT = stableCoinMint;
export const USDC_DEVNET_MINT = STABLE_COIN_MINT;

const SOLANA_DERIVATION_PATH = "m/44'/501'/0'/0'";
const COMMITMENT: Commitment = 'confirmed';
const DEFAULT_RPC_URL = 'https://api.devnet.solana.com';
const connectionByRpcUrl = new Map<string, any>();

async function loadAltudeCore(): Promise<any> {
  try {
    return require('@altude/core');
  } catch {
    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) {
      throw new Error('Unable to require module in Jest runtime: @altude/core');
    }
    return await import('@altude/core');
  }
}

async function loadScureBase(): Promise<any> {
  try {
    return require('@scure/base');
  } catch {
    return await import('@scure/base');
  }
}

async function loadScureBip39(): Promise<any> {
  try {
    return require('@scure/bip39');
  } catch {
    return await import('@scure/bip39');
  }
}

async function loadScureBip39Wordlist(): Promise<any> {
  try {
    return require('@scure/bip39/wordlists/english');
  } catch {
    return await import('@scure/bip39/wordlists/english');
  }
}

async function loadScureBip32(): Promise<any> {
  try {
    return require('@scure/bip32');
  } catch {
    return await import('@scure/bip32');
  }
}

async function loadNobleEd25519(): Promise<any> {
  try {
    return require('@noble/curves/ed25519.js');
  } catch {
    return await import('@noble/curves/ed25519.js');
  }
}

async function loadWeb3(): Promise<any> {
  if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) {
    return require('@solana/web3.js/lib/index.cjs.js');
  }
  try {
    return require('@solana/web3.js');
  } catch {
    return await import('@solana/web3.js');
  }
}

async function loadSplToken(): Promise<any> {
  try {
    return require('@solana/spl-token');
  } catch {
    return await import('@solana/spl-token');
  }
}

async function getConnection(rpcUrl = DEFAULT_RPC_URL): Promise<any> {
  const cached = connectionByRpcUrl.get(rpcUrl);
  if (cached) {return cached;}
  const {Connection} = await loadWeb3();
  const next = new Connection(rpcUrl, COMMITMENT);
  connectionByRpcUrl.set(rpcUrl, next);
  return next;
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

/**
 * Generate a new Solana wallet using BIP-39 + BIP-32 derivation.
 * Primary path uses @altude/core SDK helpers.
 * Fallback path uses local crypto libs if the SDK bundle cannot load.
 */
export async function generateDemoWallet(): Promise<WalletInfo> {
  try {
    const altudeCore = await loadAltudeCore();
    const {generateMnemonic, deriveSolanaKeypair} = altudeCore;
    const {base58} = await loadScureBase();

    const mnemonic = generateMnemonic(12);
    const keypair = await deriveSolanaKeypair(mnemonic, 0);

    return {
      publicKey: base58.encode(keypair.publicKey),
      privateKey: bytesToHex(keypair.privateKey),
    };
  } catch {
    const {generateMnemonic, mnemonicToSeed} = await loadScureBip39();
    const {wordlist} = await loadScureBip39Wordlist();
    const {HDKey} = await loadScureBip32();
    const {base58} = await loadScureBase();
    const {ed25519} = await loadNobleEd25519();

    const mnemonic = generateMnemonic(wordlist, 128); // 12 words
    const seed = await mnemonicToSeed(mnemonic);
    const root = HDKey.fromMasterSeed(seed);
    const child = root.derive(SOLANA_DERIVATION_PATH);

    if (!child.privateKey) {
      throw new Error('Failed to derive Solana keypair');
    }

    const publicKey = ed25519.getPublicKey(child.privateKey);

    return {
      publicKey: base58.encode(publicKey),
      privateKey: bytesToHex(child.privateKey),
    };
  }
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

async function ensureDevnetFunding(
  connection: any,
  payerPublicKey: any,
): Promise<void> {
  const balance = await connection.getBalance(payerPublicKey);
  const minimumBalanceLamports = 0.05 * 1_000_000_000;

  if (balance >= minimumBalanceLamports) {
    return;
  }

  const airdropLamports = 1_000_000_000;
  const signature = await connection.requestAirdrop(
    payerPublicKey,
    airdropLamports,
  );
  const latest = await connection.getLatestBlockhash(COMMITMENT);
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    COMMITMENT,
  );
}

export async function createDevnetTokenAccount(
  wallet: WalletInfo,
  mint = STABLE_COIN_MINT,
  options?: DevnetTokenAccountOptions,
): Promise<DevnetTokenAccountBootstrapResult> {
  if (ALTUDE_NETWORK !== 'devnet') {
    throw new Error('Devnet token account creation is only supported on devnet');
  }

  const {Keypair, PublicKey} = await loadWeb3();
  const {
    getOrCreateAssociatedTokenAccount,
    getAssociatedTokenAddress,
  } = await loadSplToken();
  const connection = await getConnection(DEFAULT_RPC_URL);
  const payer = Keypair.fromSeed(hexToBytes(wallet.privateKey));
  const mintPublicKey = new PublicKey(mint);
  const strict = options?.strict ?? false;

  if (!options?.skipFunding) {
    await ensureDevnetFunding(connection, payer.publicKey);
  }

  const ataAddress = await getAssociatedTokenAddress(
    mintPublicKey,
    payer.publicKey,
  );

  try {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPublicKey,
      payer.publicKey,
    );

    return {
      wallet,
      tokenAccountAddress: tokenAccount.address.toBase58(),
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
      tokenAccountAddress: ataAddress.toBase58(),
      mint,
      created: false,
      error: message,
    };
  }
}

/** Fetch SOL + USDC balances via Altude API (fast, no direct RPC needed). */
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
  const gs = getGasstation() as any;

  const [solRes, usdcRes] = await Promise.allSettled([
    gs.getBalance({account: walletAddress}) as Promise<{lamports?: number; uiAmount?: number}>,
    gs.getBalance({account: walletAddress, token: STABLE_COIN_MINT}) as Promise<{lamports?: number; uiAmount?: number}>,
  ]);

  const solBalance =
    solRes.status === 'fulfilled'
      ? (solRes.value.lamports ?? 0) / 1_000_000_000
      : 0;

  const usdcBalance =
    usdcRes.status === 'fulfilled' ? (usdcRes.value.uiAmount ?? 0) : 0;

  return {walletAddress, solBalance, usdcBalance};
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

  const connection = await getConnection(rpcUrl ?? DEFAULT_RPC_URL);
  const statuses = await connection.getSignatureStatuses([signature], {
    searchTransactionHistory: true,
  });
  const status = statuses.value[0];

  if (!status) {
    return {signature, status: 'pending', confirmed: false};
  }

  if (status.err) {
    return {
      signature,
      status: 'failed',
      confirmed: false,
      slot: status.slot,
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
    slot: status.slot,
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

