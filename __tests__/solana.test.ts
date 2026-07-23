/**
 * Unit tests for pure utility functions.
 * These functions have no native or network dependencies and run cleanly in Jest.
 */
import {isValidSolanaAddress, truncateAddress, generateId} from '../src/utils/helpers';

describe('isValidSolanaAddress', () => {
  it('accepts a valid 44-char base58 address', () => {
    expect(
      isValidSolanaAddress('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
    ).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidSolanaAddress('')).toBe(false);
  });

  it('rejects a string that is too short', () => {
    expect(isValidSolanaAddress('abc123')).toBe(false);
  });

  it('rejects an address with invalid base58 characters (zeros)', () => {
    // '0' is not a valid base58 character
    expect(isValidSolanaAddress('0'.repeat(44))).toBe(false);
  });
});

describe('truncateAddress', () => {
  it('shortens a 44-char address with 6 chars on each side', () => {
    const addr = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
    const result = truncateAddress(addr, 6);
    expect(result).toBe('4zMMC9...JDncDU');
  });

  it('returns the address unchanged when it is short enough', () => {
    const short = 'ABCDEF';
    expect(truncateAddress(short, 6)).toBe(short);
  });

  it('uses default chars=6 when no second argument given', () => {
    const addr = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
    const result = truncateAddress(addr);
    expect(result.startsWith('4zMMC9')).toBe(true);
    expect(result.endsWith('JDncDU')).toBe(true);
    expect(result).toContain('...');
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({length: 100}, () => generateId()));
    // With timestamp + random, collisions should be very rare
    expect(ids.size).toBeGreaterThan(90);
  });
});
