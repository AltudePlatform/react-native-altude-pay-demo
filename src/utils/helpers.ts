/**
 * Pure utility functions – no native modules, fully testable with Jest.
 */
import bs58 from 'bs58';

/**
 * Validates a Solana public key (base58, 32 bytes).
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) {return false;}
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

/**
 * Truncates a public key for display: "ABC123...XYZ789"
 */
export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2) {return address;}
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Simple ID generator (no external deps).
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
