/**
 * Solana wallet and RPC utilities.
 *
 * Private keys NEVER leave the device. Balances, signing, send, and
 * confirmation all run directly against Solana RPC.
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
import {WalletInfo, BalanceResponse, TransactionStatusResponse} from '../types';

export {isValidSolanaAddress, truncateAddress} from '../utils/helpers';

export const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

const COMMITMENT: Commitment = 'confirmed';
const connection = new Connection(clusterApiUrl('devnet'), COMMITMENT);
const USDC_DECIMALS = 6;
const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

export function generateDemoWallet(): WalletInfo {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
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
  const mint = new PublicKey(USDC_DEVNET_MINT);

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

  const [senderAtaInfo, recipientAtaInfo, latestBlockhash] = await Promise.all([
    connection.getAccountInfo(senderAta, COMMITMENT),
    connection.getAccountInfo(recipientAta, COMMITMENT),
    connection.getLatestBlockhash(COMMITMENT),
  ]);

  if (!senderAtaInfo) {
    throw new Error('Sender USDC account not found on devnet.');
  }

  const transaction = new Transaction({
    feePayer: sender.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
  });
  transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

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
  return Buffer.from(transaction.serialize()).toString('base64');
}

export async function broadcastSignedTransaction(
  base64SignedTransaction: string,
): Promise<string> {
  const txBytes = Buffer.from(base64SignedTransaction, 'base64');
  return connection.sendRawTransaction(txBytes, {skipPreflight: false});
}

export async function getWalletBalances(
  walletAddress: string,
): Promise<BalanceResponse> {
  const owner = new PublicKey(walletAddress);
  const mint = new PublicKey(USDC_DEVNET_MINT);

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

export async function getTransactionStatus(
  signature: string,
): Promise<TransactionStatusResponse> {
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
): Promise<TransactionStatusResponse> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = await getTransactionStatus(signature);
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
