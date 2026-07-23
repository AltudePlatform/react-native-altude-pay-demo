/**
 * AltudePay – Solana USDC Payment Demo
 *
 * Entry point. Hydrates persisted client state on startup,
 * then delegates to the navigation tree.
 */
import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {StatusBar} from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import {ensureClientState, getTheme, getWallet} from './src/services/storage';
import {useWalletStore} from './src/store/walletStore';
import {ThemePreference} from './src/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 10_000,
    },
  },
});

function AppContent(): React.JSX.Element {
  const hydrateWallet = useWalletStore(s => s.hydrate);
  const [theme, setTheme] = useState<ThemePreference>('dark');

  useEffect(() => {
    (async () => {
      await ensureClientState();
      const [wallet, savedTheme] = await Promise.all([getWallet(), getTheme()]);
      hydrateWallet(wallet);
      setTheme(savedTheme);
    })();
  }, [hydrateWallet]);

  return (
    <>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#0d0d1a' : '#ffffff'}
      />
      <AppNavigator />
    </>
  );
}

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
