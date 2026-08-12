export const ALTUDE_API_KEY =
  (typeof process !== 'undefined' && process.env.ALTUDE_API_KEY) ||
  'ak_YbBKrObNGCmGlk5d2qHte9HEgngK-mZtsosTJNtQsO8';

export const ALTUDE_NETWORK: 'devnet' | 'mainnet' =
  (process.env.ALTUDE_NETWORK as 'devnet' | 'mainnet') || 'devnet';
