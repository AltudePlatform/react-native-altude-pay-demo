/**
 * Local-first storage helpers using AsyncStorage.
 *
 * The mobile app owns persisted state.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BalanceResponse,
  GetHistorySummary,
  ThemePreference,
  TokenMetadata,
  TransactionRecord,
  UserPreferences,
  UserProfile,
  WalletInfo,
} from '../types';

import {stableCoinMint} from '../config/paymentConfig';

const KEYS = {
  WALLET: '@altudepay/wallet',
  HISTORY: '@altudepay/history',
  RECENT_RECIPIENTS: '@altudepay/recent-recipients',
  PREFERENCES: '@altudepay/preferences',
  USER_PROFILE: '@altudepay/user-profile',
  THEME: '@altudepay/theme',
  TOKEN_LIST: '@altudepay/token-list',
  ACTIVE_LOGIN: '@altudepay/active-login',

  /**
   * Stores wallets associated with a phone number or email.
   *
   * Example:
   *
   * {
   *   "phone:+639123456789": {
   *     wallet: {...},
   *     profile: {...}
   *   },
   *   "email:john@example.com": {
   *     wallet: {...},
   *     profile: {...}
   *   }
   * }
   */
  USER_WALLETS: '@altudepay/user-wallets',
} as const;

const DEFAULT_PREFERENCES: UserPreferences = {
  confirmBeforeSending: true,
};

const DEFAULT_THEME: ThemePreference = 'dark';
const EMPTY_HISTORY: TransactionRecord = {
  id: '',
  walletAddress: '',
  data: [],
  page: 1,
  pageSize: 0,
  limit: 0,
  offset: 0,
  total: 0,
  status: 'success',
};

const DEFAULT_TOKEN_LIST: TokenMetadata[] = [
  {
    mint: stableCoinMint,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
];

/**
 * Login identity supplied by the user.
 *
 * Only one identity is expected to be available:
 *
 * - phone number + country code
 * - OR email
 *
 * Phone takes priority when both are available.
 */
export type LoginIdentity = {
  countryCode?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
};

export type ActiveLogin = {
  identity: LoginIdentity;
};

export async function saveActiveLogin(
  identity: LoginIdentity,
): Promise<void> {
  const identityKey = getLoginIdentityKey(identity);

  if (!identityKey) {
    throw new Error(
      'A phone number or email is required.',
    );
  }

  await AsyncStorage.setItem(
    KEYS.ACTIVE_LOGIN,
    JSON.stringify({
      identity,
    }),
  );
}

export async function getActiveLogin(): Promise<ActiveLogin | null> {
  return readJson<ActiveLogin | null>(
    KEYS.ACTIVE_LOGIN,
    null,
  );
}

export async function clearActiveLogin(): Promise<void> {
  await AsyncStorage.removeItem(
    KEYS.ACTIVE_LOGIN,
  );
}
/**
 * Wallet and profile stored for a user.
 */
export type StoredUserWallet = {
  wallet: WalletInfo;
  profile?: UserProfile;
};

type UserWallets = Record<string, StoredUserWallet>;

function balanceCacheKey(walletAddress: string): string {
  return `@altudepay/balance/${walletAddress}`;
}

/**
 * Generic JSON reader.
 */
async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Normalize an email so that:
 *
 * John@Example.com
 *
 * and
 *
 * john@example.com
 *
 * are treated as the same account.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize a phone number.
 *
 * Removes spaces and trims the value.
 *
 * Example:
 *
 * +63 912 345 6789
 *
 * becomes:
 *
 * +639123456789
 */
function normalizePhone(
  countryCode?: string | null,
  phoneNumber?: string | null,
): string {
  return `${countryCode ?? ''}${phoneNumber ?? ''}`
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Creates the unique local identity key used to associate
 * a user with their wallet.
 *
 * Phone number has priority.
 *
 * If phone is unavailable, email is used.
 */
function getLoginIdentityKey(
  identity: LoginIdentity,
): string | null {
  const phone = normalizePhone(
    identity.countryCode,
    identity.phoneNumber,
  );

  if (phone) {
    return `phone:${phone}`;
  }

  const email = identity.email?.trim();

  if (email) {
    return `email:${normalizeEmail(email)}`;
  }

  return null;
}

/**
 * Initializes default client state.
 */
export async function ensureClientState(): Promise<void> {
  const [preferences, theme, tokenList] = await Promise.all([
    AsyncStorage.getItem(KEYS.PREFERENCES),
    AsyncStorage.getItem(KEYS.THEME),
    AsyncStorage.getItem(KEYS.TOKEN_LIST),
  ]);

  const writes: Promise<void>[] = [];

  if (!preferences) {
    writes.push(
      AsyncStorage.setItem(
        KEYS.PREFERENCES,
        JSON.stringify(DEFAULT_PREFERENCES),
      ),
    );
  }

  if (!theme) {
    writes.push(
      AsyncStorage.setItem(
        KEYS.THEME,
        DEFAULT_THEME,
      ),
    );
  }

  if (!tokenList) {
    writes.push(
      AsyncStorage.setItem(
        KEYS.TOKEN_LIST,
        JSON.stringify(DEFAULT_TOKEN_LIST),
      ),
    );
  }

  await Promise.all(writes);
}

/* -------------------------------------------------------------------------- */
/* Preferences                                                                */
/* -------------------------------------------------------------------------- */

export async function getUserPreferences(): Promise<UserPreferences> {
  return readJson(
    KEYS.PREFERENCES,
    DEFAULT_PREFERENCES,
  );
}

export async function saveUserPreferences(
  preferences: UserPreferences,
): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.PREFERENCES,
    JSON.stringify(preferences),
  );
}

/* -------------------------------------------------------------------------- */
/* User profile                                                                */
/* -------------------------------------------------------------------------- */

export async function getUserProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(
    KEYS.USER_PROFILE,
  );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveUserProfile(
  profile: UserProfile,
): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.USER_PROFILE,
    JSON.stringify(profile),
  );
}

export async function clearUserProfile(): Promise<void> {
  await AsyncStorage.removeItem(
    KEYS.USER_PROFILE,
  );
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const profile = await getUserProfile();

  return Boolean(
    profile &&
      (
        (
          profile.countryCode.trim() &&
          profile.phoneNumber.trim()
        ) ||
        profile.email.trim()
      ),
  );
}

/* -------------------------------------------------------------------------- */
/* Theme                                                                       */
/* -------------------------------------------------------------------------- */

export async function getTheme(): Promise<ThemePreference> {
  const savedTheme = await AsyncStorage.getItem(
    KEYS.THEME,
  );

  return savedTheme === 'light'
    ? 'light'
    : DEFAULT_THEME;
}

export async function saveTheme(
  theme: ThemePreference,
): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.THEME,
    theme,
  );
}

/* -------------------------------------------------------------------------- */
/* Token list                                                                  */
/* -------------------------------------------------------------------------- */

export async function getCachedTokenList(): Promise<TokenMetadata[]> {
  return readJson(
    KEYS.TOKEN_LIST,
    DEFAULT_TOKEN_LIST,
  );
}

export async function saveCachedTokenList(
  tokens: TokenMetadata[],
): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.TOKEN_LIST,
    JSON.stringify(tokens),
  );
}

/* -------------------------------------------------------------------------- */
/* Active wallet                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Saves the currently active wallet.
 */
export async function saveWallet(
  wallet: WalletInfo,
): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.WALLET,
    JSON.stringify(wallet),
  );
}

/**
 * Gets the currently active wallet.
 */
export async function getWallet(): Promise<WalletInfo | null> {
  const raw = await AsyncStorage.getItem(
    KEYS.WALLET,
  );

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      raw,
    ) as Partial<WalletInfo>;

    if (
      typeof parsed?.publicKey !== 'string' ||
      parsed.publicKey.trim().length === 0 ||
      typeof parsed?.privateKey !== 'string' ||
      parsed.privateKey.trim().length === 0
    ) {
      return null;
    }

    return {
      publicKey: parsed.publicKey,
      privateKey: parsed.privateKey,
    };
  } catch {
    return null;
  }
}

/**
 * Clears the currently active wallet.
 *
 * This does NOT delete the wallet association stored in USER_WALLETS.
 */
export async function clearWallet(): Promise<void> {
  await AsyncStorage.removeItem(
    KEYS.WALLET,
  );
}

/* -------------------------------------------------------------------------- */
/* User ↔ Wallet                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Saves a wallet against a user's phone number or email.
 *
 * This is what allows the user to log out and later restore
 * the same wallet.
 */
export async function saveWalletForUser(
  identity: LoginIdentity,
  wallet: WalletInfo,
  profile?: UserProfile,
): Promise<void> {
  const identityKey = getLoginIdentityKey(identity);

  if (!identityKey) {
    throw new Error(
      'A phone number or email is required to save the wallet.',
    );
  }

  const users = await readJson<UserWallets>(
    KEYS.USER_WALLETS,
    {},
  );

  users[identityKey] = {
    wallet,
    profile,
  };

  await AsyncStorage.setItem(
    KEYS.USER_WALLETS,
    JSON.stringify(users),
  );
}

/**
 * Checks whether a wallet/account exists for the supplied
 * phone number or email.
 */
export async function hasUserAccount(
  identity: LoginIdentity,
): Promise<boolean> {
  const identityKey = getLoginIdentityKey(identity);

  if (!identityKey) {
    return false;
  }

  const users = await readJson<UserWallets>(
    KEYS.USER_WALLETS,
    {},
  );

  return Boolean(users[identityKey]);
}

/**
 * Logs in a user using their phone number or email
 * and restores their previously associated wallet.
 *
 * Returns null when no account is found.
 */
export async function loginWithIdentity(
  identity: LoginIdentity,
): Promise<StoredUserWallet | null> {
  const identityKey = getLoginIdentityKey(identity);

  if (!identityKey) {
    return null;
  }

  const users = await readJson<UserWallets>(
    KEYS.USER_WALLETS,
    {},
  );

  const storedUser = users[identityKey];

  if (!storedUser) {
    return null;
  }

  await saveWallet(storedUser.wallet);

  if (storedUser.profile) {
    await saveUserProfile(storedUser.profile);
  }

  // Remember who is currently logged in.
  await saveActiveLogin(identity);

  return storedUser;
}

/**
 * Logs out the current user.
 *
 * Before clearing the active wallet/profile, the wallet is
 * saved against the user's phone/email so it can be restored
 * later.
 */
export async function logout(): Promise<void> {
  const [profile, wallet, activeLogin] =
    await Promise.all([
      getUserProfile(),
      getWallet(),
      getActiveLogin(),
    ]);

  // Preserve wallet → identity association.
  if (wallet && activeLogin) {
    await saveWalletForUser(
      activeLogin.identity,
      wallet,
      profile ?? undefined,
    );
  }

  await Promise.all([
    clearWallet(),
    clearUserProfile(),
    clearActiveLogin(),
    clearHistory(),
    clearRecentRecipients(),
  ]);
}

/* -------------------------------------------------------------------------- */
/* History                                                                     */
/* -------------------------------------------------------------------------- */

export async function getHistory(): Promise<TransactionRecord> {
  return readJson(
    KEYS.HISTORY,
    EMPTY_HISTORY,
  );
}

export async function appendToHistory(
  record: TransactionRecord,
): Promise<TransactionRecord> {
  const history = await getHistory();

  await AsyncStorage.setItem(
    KEYS.HISTORY,
    JSON.stringify({
      data: [
        record.data,
        ...history.data,
      ],
    }),
  );

  return history;
}

export async function updateHistoryRecord(
  signature: string,
  patch: Partial<GetHistorySummary>,
): Promise<void> {
  const history = await getHistory();

  const updated = history.data.map(
    (r: GetHistorySummary) =>
      r.id === patch.id
        ? {
            ...r,
            ...patch,
          }
        : r,
  );

  await AsyncStorage.setItem(
    KEYS.HISTORY,
    JSON.stringify({
      data: updated,
    }),
  );
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(
    KEYS.HISTORY,
  );
}

/* -------------------------------------------------------------------------- */
/* Recent recipients                                                           */
/* -------------------------------------------------------------------------- */

export async function getRecentRecipients(): Promise<string[]> {
  return readJson(
    KEYS.RECENT_RECIPIENTS,
    [] as string[],
  );
}

export async function addRecentRecipient(
  address: string,
): Promise<string[]> {
  const recent = await getRecentRecipients();

  const updated = [
    address,
    ...recent.filter(
      existingAddress =>
        existingAddress !== address,
    ),
  ].slice(0, 5);

  await AsyncStorage.setItem(
    KEYS.RECENT_RECIPIENTS,
    JSON.stringify(updated),
  );

  return updated;
}

export async function clearRecentRecipients(): Promise<void> {
  await AsyncStorage.removeItem(
    KEYS.RECENT_RECIPIENTS,
  );
}

/* -------------------------------------------------------------------------- */
/* Balance cache                                                               */
/* -------------------------------------------------------------------------- */

export async function getCachedBalance(
  walletAddress: string,
): Promise<BalanceResponse | null> {
  const cached = await readJson<BalanceResponse | null>(
    balanceCacheKey(walletAddress),
    null,
  );

  return cached?.walletAddress === walletAddress
    ? cached
    : null;
}

export async function saveCachedBalance(
  balance: BalanceResponse,
): Promise<void> {
  await AsyncStorage.setItem(
    balanceCacheKey(balance.walletAddress),
    JSON.stringify(balance),
  );
}

export async function getWalletByIdentity(
  identity: LoginIdentity,
): Promise<WalletInfo | null> {
  const identityKey = getLoginIdentityKey(identity);

  if (!identityKey) {
    return null;
  }

  const users = await readJson<UserWallets>(
    KEYS.USER_WALLETS,
    {},
  );

  const storedUser = users[identityKey];

  if (!storedUser?.wallet) {
    return null;
  }

  return storedUser.wallet;
}