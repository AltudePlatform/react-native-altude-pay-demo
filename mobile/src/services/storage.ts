/**
 * Local-first storage helpers using AsyncStorage.
 * The mobile app owns persisted state; the backend remains stateless.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  BalanceResponse,
  ThemePreference,
  TokenMetadata,
  TransactionRecord,
  UserPreferences,
  WalletInfo,
} from '../types';

const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

const KEYS = {
  WALLET: '@altudepay/wallet',
  HISTORY: '@altudepay/history',
  RECENT_RECIPIENTS: '@altudepay/recent-recipients',
  SETTINGS: '@altudepay/settings',
  PREFERENCES: '@altudepay/preferences',
  THEME: '@altudepay/theme',
  TOKEN_LIST: '@altudepay/token-list',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  backendBroadcastEnabled: true,
};

const DEFAULT_PREFERENCES: UserPreferences = {
  confirmBeforeSending: true,
};

const DEFAULT_THEME: ThemePreference = 'dark';

const DEFAULT_TOKEN_LIST: TokenMetadata[] = [
  {
    mint: USDC_DEVNET_MINT,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
];

function balanceCacheKey(walletAddress: string): string {
  return `@altudepay/balance/${walletAddress}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function ensureClientState(): Promise<void> {
  const [settings, preferences, theme, tokenList] = await Promise.all([
    AsyncStorage.getItem(KEYS.SETTINGS),
    AsyncStorage.getItem(KEYS.PREFERENCES),
    AsyncStorage.getItem(KEYS.THEME),
    AsyncStorage.getItem(KEYS.TOKEN_LIST),
  ]);

  const writes: Promise<void>[] = [];

  if (!settings) {
    writes.push(
      AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS)),
    );
  }

  if (!preferences) {
    writes.push(
      AsyncStorage.setItem(
        KEYS.PREFERENCES,
        JSON.stringify(DEFAULT_PREFERENCES),
      ),
    );
  }

  if (!theme) {
    writes.push(AsyncStorage.setItem(KEYS.THEME, DEFAULT_THEME));
  }

  if (!tokenList) {
    writes.push(
      AsyncStorage.setItem(KEYS.TOKEN_LIST, JSON.stringify(DEFAULT_TOKEN_LIST)),
    );
  }

  await Promise.all(writes);
}

export async function getSettings(): Promise<AppSettings> {
  return readJson(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getUserPreferences(): Promise<UserPreferences> {
  return readJson(KEYS.PREFERENCES, DEFAULT_PREFERENCES);
}

export async function saveUserPreferences(
  preferences: UserPreferences,
): Promise<void> {
  await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(preferences));
}

export async function getTheme(): Promise<ThemePreference> {
  const savedTheme = await AsyncStorage.getItem(KEYS.THEME);
  return savedTheme === 'light' ? 'light' : DEFAULT_THEME;
}

export async function saveTheme(theme: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME, theme);
}

export async function getCachedTokenList(): Promise<TokenMetadata[]> {
  return readJson(KEYS.TOKEN_LIST, DEFAULT_TOKEN_LIST);
}

export async function saveCachedTokenList(tokens: TokenMetadata[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TOKEN_LIST, JSON.stringify(tokens));
}

export async function saveWallet(wallet: WalletInfo): Promise<void> {
  await AsyncStorage.setItem(KEYS.WALLET, JSON.stringify(wallet));
}

export async function getWallet(): Promise<WalletInfo | null> {
  const raw = await AsyncStorage.getItem(KEYS.WALLET);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WalletInfo;
  } catch {
    return null;
  }
}

export async function clearWallet(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.WALLET);
}

export async function getHistory(): Promise<TransactionRecord[]> {
  return readJson(KEYS.HISTORY, [] as TransactionRecord[]);
}

export async function appendToHistory(
  record: TransactionRecord,
): Promise<TransactionRecord[]> {
  const history = await getHistory();
  const updated = [record, ...history];
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  return updated;
}

export async function updateHistoryRecord(
  id: string,
  patch: Partial<TransactionRecord>,
): Promise<void> {
  const history = await getHistory();
  const updated = history.map(r => (r.id === id ? {...r, ...patch} : r));
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.HISTORY);
}

export async function getRecentRecipients(): Promise<string[]> {
  return readJson(KEYS.RECENT_RECIPIENTS, [] as string[]);
}

export async function addRecentRecipient(address: string): Promise<string[]> {
  const recent = await getRecentRecipients();
  const updated = [address, ...recent.filter(item => item !== address)].slice(0, 5);
  await AsyncStorage.setItem(KEYS.RECENT_RECIPIENTS, JSON.stringify(updated));
  return updated;
}

export async function clearRecentRecipients(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.RECENT_RECIPIENTS);
}

export async function getCachedBalance(
  walletAddress: string,
): Promise<BalanceResponse | null> {
  const cached = await readJson<BalanceResponse | null>(
    balanceCacheKey(walletAddress),
    null,
  );
  return cached?.walletAddress === walletAddress ? cached : null;
}

export async function saveCachedBalance(
  balance: BalanceResponse,
): Promise<void> {
  await AsyncStorage.setItem(
    balanceCacheKey(balance.walletAddress),
    JSON.stringify(balance),
  );
}
