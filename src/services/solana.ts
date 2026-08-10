/**
 * Solana wallet and RPC utilities.
 *
 * Private keys NEVER leave the device. Transactions are locally signed,
 * then submitted through Altude transaction APIs.
 */
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  clusterApiUrl,
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  Transaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import {getTransactionBlockhash, getTransactionConfig} from './altudeApi';
import {WalletInfo, BalanceResponse, TransactionStatusResponse} from '../types';
import {stableCoinMint} from '../config/paymentConfig';

export {isValidSolanaAddress, truncateAddress} from '../utils/helpers';

export const STABLE_COIN_MINT = stableCoinMint;
export const USDC_DEVNET_MINT = STABLE_COIN_MINT;

const COMMITMENT: Commitment = 'confirmed';
const DEFAULT_RPC_URL = clusterApiUrl('devnet');
const connectionByRpcUrl = new Map<string, Connection>();
const USDC_DECIMALS = 6;
const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

function getConnection(rpcUrl = DEFAULT_RPC_URL): Connection {
  const cached = connectionByRpcUrl.get(rpcUrl);
  if (cached) {
    return cached;
  }

  const next = new Connection(rpcUrl, COMMITMENT);
  connectionByRpcUrl.set(rpcUrl, next);
  return next;
}

export async function generateDemoWallet(): Promise<WalletInfo> {
  const wallet = Keypair.generate();
  return {
    publicKey: wallet.publicKey.toBase58(),
    privateKey: bs58.encode(wallet.secretKey),
  };
}

export function keypairFromPrivateKey(privateKeyBase58: string): Keypair {
  const secretKey = bs58.decode(privateKeyBase58);
  return Keypair.fromSecretKey(secretKey);
}

interface CreateSignedUsdcTransferParams {
  senderPrivateKey: string;
  recipientAddress: string;
  amount: number;
  memo?: string;
}

export async function createSignedUsdcTransferTransaction({
  senderPrivateKey,
  recipientAddress,
  amount,
  memo,
}: CreateSignedUsdcTransferParams): Promise<string> {
  const sender = keypairFromPrivateKey(senderPrivateKey);
  const recipient = new PublicKey(recipientAddress);
  const mint = new PublicKey(STABLE_COIN_MINT);

  const [config, blockhash] = await Promise.all([
    getTransactionConfig(),
    getTransactionBlockhash(),
  ]);

  const connection = getConnection(config.RpcUrl);

  let feePayer: PublicKey;
  try {
    feePayer = new PublicKey(config.FeePayer);
  } catch {
    throw new Error('Altude config returned an invalid FeePayer address');
  }

  const amountBaseUnits = BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
  if (amountBaseUnits <= 0n) {
    throw new Error('Amount must be greater than 0');
  }

  const senderAta = getAssociatedTokenAddressSync(
    mint,
    sender.publicKey,
    false,
  );
  const recipientAta = getAssociatedTokenAddressSync(mint, recipient, false);

  const [senderAtaInfo, recipientAtaInfo] = await Promise.all([
    connection.getAccountInfo(senderAta, COMMITMENT),
    connection.getAccountInfo(recipientAta, COMMITMENT),
  ]);

  if (!senderAtaInfo) {
    throw new Error('Sender USDC account not found on the configured network.');
  }

  const transaction = new Transaction({
    feePayer,
    recentBlockhash: blockhash,
  });

  if (!recipientAtaInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        sender.publicKey,
        recipientAta,
        recipient,
        mint,
      ),
    );
  }

  transaction.add(
    createTransferCheckedInstruction(
      senderAta,
      mint,
      recipientAta,
      sender.publicKey,
      amountBaseUnits,
      USDC_DECIMALS,
    ),
  );

  if (memo) {
    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memo, 'utf8'),
      }),
    );
  }

  transaction.sign(sender);
  return Buffer.from(
    transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }),
  ).toString('base64');
}

export async function broadcastSignedTransaction(
  base64SignedTransaction: string,
): Promise<string> {
  const txBytes = Buffer.from(base64SignedTransaction, 'base64');
  const connection = getConnection();
  return connection.sendRawTransaction(txBytes, {skipPreflight: false});
}

export async function getWalletBalances(
  walletAddress: string,
): Promise<BalanceResponse> {
  const connection = getConnection();
  const owner = new PublicKey(walletAddress);
  const mint = new PublicKey(STABLE_COIN_MINT);

  const [solBalanceLamports, tokenAccounts] = await Promise.all([
    connection.getBalance(owner, COMMITMENT),
    connection.getParsedTokenAccountsByOwner(owner, {mint}, COMMITMENT),
  ]);

  const usdcBalance = tokenAccounts.value.reduce((total, account) => {
    const amount = account.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
    return total + amount;
  }, 0);

  return {
    walletAddress,
    solBalance: solBalanceLamports / 1_000_000_000,
    usdcBalance,
  };
}

interface EnsureMinimumSolBalanceResult {
  initialSolBalance: number;
  finalSolBalance: number;
  airdroppedSol: number;
}

/**
 * Devnet helper for demos: top up SOL until the wallet reaches a minimum balance.
 */
export async function ensureMinimumSolBalance(
  walletAddress: string,
  minimumSol = 10,
): Promise<EnsureMinimumSolBalanceResult> {
  const connection = getConnection(DEFAULT_RPC_URL);
  const owner = new PublicKey(walletAddress);
  const lamportsPerSol = 1_000_000_000;
  const maxAirdropPerRequestSol = 2;

  const readSolBalance = async () => {
    const balanceLamports = await connection.getBalance(owner, COMMITMENT);
    return balanceLamports / lamportsPerSol;
  };

  const initialSolBalance = await readSolBalance();
  let currentSolBalance = initialSolBalance;

  while (currentSolBalance + 0.000001 < minimumSol) {
    const remainingSol = minimumSol - currentSolBalance;
    const requestSol = Math.min(maxAirdropPerRequestSol, remainingSol);
    const requestLamports = Math.max(1, Math.floor(requestSol * lamportsPerSol));

    const signature = await connection.requestAirdrop(owner, requestLamports);
    await connection.confirmTransaction(signature, COMMITMENT);
    currentSolBalance = await readSolBalance();
  }

  return {
    initialSolBalance,
    finalSolBalance: currentSolBalance,
    airdroppedSol: Math.max(0, currentSolBalance - initialSolBalance),
  };
}

export async function getTransactionStatus(
  signature: string,
  rpcUrl?: string,
): Promise<TransactionStatusResponse> {
  const connection = getConnection(rpcUrl);
  const statuses = await connection.getSignatureStatuses([signature], {
    searchTransactionHistory: true,
  });
  const status = statuses.value[0];

  if (!status) {
    return {
      signature,
      status: 'pending',
      confirmed: false,
    };
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

  return {
    signature,
    status: 'pending',
    confirmed: false,
  };
}
