import {create} from 'zustand';
import {saveUsername, clearUsername} from '../services/storage';

interface AuthState {
  username: string | null;
  isLoggedIn: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: (username: string | null) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  username: null,
  isLoggedIn: false,

  login: async (username: string) => {
    await saveUsername(username);
    set({username, isLoggedIn: true});
  },

  logout: async () => {
    await clearUsername();
    set({username: null, isLoggedIn: false});
  },

  hydrate: (username: string | null) => {
    set({username, isLoggedIn: username !== null});
  },
}));
