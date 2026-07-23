/**
 * Solana wallet utilities.
 *
 * Private keys NEVER leave the device – signing is done entirely on the
 * frontend before the signed bytes are sent to the backend for broadcast.
 */
import {Keypair, Message, Transaction} from '@solana/web3.js';
import bs58 from 'bs58';
import {WalletInfo} from '../types';

// Re-export pure helpers so callers can import from one place
export {isValidSolanaAddress, truncateAddress} from '../utils/helpers';

// ─── Wallet generation ─────────────────────────────────────────────

/**
 * Generates a new random Solana keypair for demo purposes.
 * Both the public key and the base58-encoded private key are returned.
 * The private key is stored locally on the device only.
 */
export function generateDemoWallet(): WalletInfo {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
  };
}

/**
 * Restores a Keypair from a base58-encoded secret key.
 */
export function keypairFromPrivateKey(privateKeyBase58: string): Keypair {
  const secretKey = bs58.decode(privateKeyBase58);
  return Keypair.fromSecretKey(secretKey);
}

// ─── Transaction signing ───────────────────────────────────────────

/**
 * Signs the unsigned transaction message bytes returned by the backend.
 *
 * @param base64Message  Base64-encoded compiled Solana message (from backend)
 * @param privateKeyBase58  Signer's base58 private key (never leaves device)
 * @returns  Base64-encoded fully-signed transaction ready to broadcast
 */
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
