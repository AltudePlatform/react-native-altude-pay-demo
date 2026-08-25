export const ALTUDE_API_KEY =
  (typeof process !== 'undefined' && process.env.ALTUDE_API_KEY) || '';

export function hasAltudeApiKey(): boolean {
  return Boolean(
    ALTUDE_API_KEY.trim() && !ALTUDE_API_KEY.startsWith('REPLACE_'),
  );
}
