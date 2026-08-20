export const ALTUDE_API_KEY =
  (typeof process !== 'undefined' && process.env.ALTUDE_API_KEY) || '';

export const ALTUDE_NETWORK: 'devnet' | 'mainnet' =
  (process.env.ALTUDE_NETWORK as 'devnet' | 'mainnet') || 'devnet';

export function hasAltudeApiKey(): boolean {
  return Boolean(
    ALTUDE_API_KEY.trim() && !ALTUDE_API_KEY.startsWith('REPLACE_'),
  );
}
