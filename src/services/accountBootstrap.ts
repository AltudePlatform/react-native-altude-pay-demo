import {WalletInfo} from '../types';
import {createDevnetTokenAccount, generateDemoWallet} from './solana';
import {getWallet, saveWallet} from './storage';
import {runtimeConfig} from '../config/runtimeConfig';

let ensureWalletInFlight: Promise<WalletInfo> | null = null;

export async function createDemoAccount(): Promise<WalletInfo> {
  const wallet = await generateDemoWallet();

  if (!runtimeConfig.useMockData) {
    void createDevnetTokenAccount(wallet, undefined, {
      skipFunding: true,
      strict: false,
    }).catch(error => {
      console.warn('[accountBootstrap] Token account setup failed:', error);
    });
  }

  try {
    await saveWallet(wallet);
  } catch {
    // Continue with the in-memory wallet if persistence is unavailable.
  }

  return wallet;
}

export async function ensureDemoAccount(): Promise<WalletInfo> {
  if (ensureWalletInFlight) {
    return ensureWalletInFlight;
  }

  ensureWalletInFlight = (async () => {
    const existingWallet = await getWallet();
    if (existingWallet) {
      return existingWallet;
    }

    return createDemoAccount();
  })();

  try {
    return await ensureWalletInFlight;
  } finally {
    ensureWalletInFlight = null;
  }
}

