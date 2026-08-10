const DEFAULT_STABLE_COIN_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

export const stableCoinMint =
  (typeof process !== 'undefined' && process.env.STABLE_COIN_MINT) ||
  DEFAULT_STABLE_COIN_MINT;
