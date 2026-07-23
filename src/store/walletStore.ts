import {create} from 'zustand';
import {WalletInfo} from '../types';
import {saveWallet, clearWallet} from '../services/storage';

interface WalletState {
  wallet: WalletInfo | null;
  setWallet: (wallet: WalletInfo) => Promise<void>;
  removeWallet: () => Promise<void>;
  hydrate: (wallet: WalletInfo | null) => void;
}

export const useWalletStore = create<WalletState>(set => ({
  wallet: null,

  setWallet: async (wallet: WalletInfo) => {
    await saveWallet(wallet);
    set({wallet});
  },

  removeWallet: async () => {
    await clearWallet();
    set({wallet: null});
  },

  hydrate: (wallet: WalletInfo | null) => {
    set({wallet});
  },
}));
