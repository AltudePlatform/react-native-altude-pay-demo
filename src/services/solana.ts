/**
 * Solana wallet and RPC utilities.
 *
 * Private keys NEVER leave the device. Balances and confirmations come
 * directly from Solana RPC so the backend stays optional and stateless.
 */
import {
  clusterApiUrl,
  Commitment,
  Connection,
  Keypair,
  Message,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import {WalletInfo, BalanceResponse, TransactionStatusResponse} from '../types';

export {isValidSolanaAddress, truncateAddress} from '../utils/helpers';

export const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

const COMMITMENT: Commitment = 'confirmed';
const connection = new Connection(clusterApiUrl('devnet'), COMMITMENT);

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

export function signTransaction(
  base64Message: string,
  privateKeyBase58: string,
): string {
  const messageBytes = Buffer.from(base64Message, 'base64');
  const message = Message.from(messageBytes);

  const keypair = keypairFromPrivateKey(privateKeyBase58);
  const transaction = Transaction.populate(message, []);

  transaction.sign(keypair);

  const signedBytes = transaction.serialize();
  return Buffer.from(signedBytes).toString('base64');
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
