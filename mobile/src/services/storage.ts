/**
 * Local storage helpers using AsyncStorage.
 * All wallet data stays on device – private keys are never transmitted.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TransactionRecord, WalletInfo} from '../types';

const KEYS = {
  USERNAME: '@altudepay/username',
  WALLET: '@altudepay/wallet',
  HISTORY: '@altudepay/history',
} as const;

// ─── Auth ──────────────────────────────────────────────────────────

export async function saveUsername(username: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USERNAME, username);
}

export async function getUsername(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USERNAME);
}

export async function clearUsername(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USERNAME);
}

// ─── Wallet ────────────────────────────────────────────────────────

export async function saveWallet(wallet: WalletInfo): Promise<void> {
  await AsyncStorage.setItem(KEYS.WALLET, JSON.stringify(wallet));
}

export async function getWallet(): Promise<WalletInfo | null> {
  const raw = await AsyncStorage.getItem(KEYS.WALLET);
  if (!raw) return null;
  return JSON.parse(raw) as WalletInfo;
}

export async function clearWallet(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.WALLET);
}

// ─── Transaction history ───────────────────────────────────────────

export async function getHistory(): Promise<TransactionRecord[]> {
  const raw = await AsyncStorage.getItem(KEYS.HISTORY);
  if (!raw) return [];
  return JSON.parse(raw) as TransactionRecord[];
}

export async function appendToHistory(
  record: TransactionRecord,
): Promise<void> {
  const history = await getHistory();
  // Most recent first
  const updated = [record, ...history];
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
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
