/**
 * AltudePay – Solana USDC Payment Demo
 *
 * Entry point. Hydrates persisted auth / wallet state on startup,
 * then delegates to the navigation tree.
 */
import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {StatusBar} from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import {useAuthStore} from './src/store/authStore';
import {useWalletStore} from './src/store/walletStore';
import {getUsername, getWallet} from './src/services/storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 10_000,
    },
  },
});

function AppContent(): React.JSX.Element {
  const hydrateAuth = useAuthStore(s => s.hydrate);
  const hydrateWallet = useWalletStore(s => s.hydrate);

  // Restore persisted state on mount
  useEffect(() => {
    (async () => {
      const [username, wallet] = await Promise.all([getUsername(), getWallet()]);
      hydrateAuth(username);
      hydrateWallet(wallet);
    })();
  }, [hydrateAuth, hydrateWallet]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d1a" />
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
