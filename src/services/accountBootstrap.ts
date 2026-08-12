import {WalletInfo} from '../types';
import {createDevnetTokenAccount, generateDemoWallet} from './solana';
import {saveWallet} from './storage';
import {runtimeConfig} from '../config/runtimeConfig';

export async function createDemoAccount(): Promise<WalletInfo> {
  const wallet = await generateDemoWallet();

  if (!runtimeConfig.useMockData) {
    await createDevnetTokenAccount(wallet, undefined, {
      skipFunding: true,
      strict: false,
    });
  }

  try {
    await saveWallet(wallet);
  } catch {
    // Continue with the in-memory wallet if persistence is unavailable.
  }

  return wallet;
}
