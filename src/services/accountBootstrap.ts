import {WalletInfo} from '../types';
import {createDevnetTokenAccount, generateDemoWallet} from './solana';
import {getWallet, saveWallet, saveWalletForUser} from './storage';
import {runtimeConfig} from '../config/runtimeConfig';

let ensureWalletInFlight: Promise<WalletInfo> | null = null;

export async function createDemoAccount(profile: UserProfile): Promise<WalletInfo> {
  const wallet = await generateDemoWallet();

  if (!runtimeConfig.useMockData) {
    void createDevnetTokenAccount(wallet, undefined, {
      skipFunding: true,
      strict: false,
    }).then(async () => {
      // Token account setup succeeded.
      
    })
    .catch(error => {
      console.warn('[accountBootstrap] Token account setup failed:', error);
    });
  }

  try {
    await saveWalletForUser(
        {
          countryCode: profile.countryCode,
          phoneNumber: profile.phoneNumber,
          email: profile.email,
        },
        wallet,
        profile,
      );
  } catch {
    // Continue with the in-memory wallet if persistence is unavailable.
  }

  return wallet;
}

export async function ensureDemoAccount(profile: UserProfile): Promise<WalletInfo> {
  if (ensureWalletInFlight) {
    return ensureWalletInFlight;
  }

  ensureWalletInFlight = (async () => {
    const existingWallet = await getWallet();
    if (existingWallet) {
      return existingWallet;
    }

    return createDemoAccount(profile);
  })();

  try {
    return await ensureWalletInFlight;
  } finally {
    ensureWalletInFlight = null;
  }
}

