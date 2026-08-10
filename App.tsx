/**
 * AltudePay – Solana USDC Payment Demo
 *
 * Entry point. Hydrates persisted client state on startup,
 * then delegates to the navigation tree.
 */
import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {StatusBar, View, ActivityIndicator, StyleSheet, Text} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import {
  ensureClientState,
  getWallet,
  hasCompletedOnboarding,
  saveUserProfile,
} from './src/services/storage';
import {useWalletStore} from './src/store/walletStore';
import {UserProfile} from './src/types';
import {tokens} from './src/theme/tokens';
import {ensureMinimumSolBalance, generateDemoWallet} from './src/services/solana';

type RootErrorBoundaryState = {
  errorMessage: string | null;
};

class RootErrorBoundary extends React.Component<
  {children: React.ReactNode},
  RootErrorBoundaryState
> {
  state: RootErrorBoundaryState = {
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return {
      errorMessage: error?.message || 'Unknown render error',
    };
  }

  componentDidCatch(error: Error): void {
    // Keep a native-visible breadcrumb even when JS logs are unavailable in terminal.
    console.error('RootErrorBoundary caught error:', error);
  }

  render(): React.ReactNode {
    if (this.state.errorMessage) {
      return (
        <View style={styles.rootErrorContainer}>
          <Text style={styles.rootErrorTitle}>Render Error</Text>
          <Text style={styles.rootErrorMessage}>{this.state.errorMessage}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise.then(
      value => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      error => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

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
  const setWallet = useWalletStore(s => s.setWallet);
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await ensureClientState();
        const [storedWallet, completed] = await Promise.all([
          getWallet(),
          hasCompletedOnboarding(),
        ]);

        const wallet =
          storedWallet ??
          (await withTimeout(
            generateDemoWallet(),
            12_000,
            'Wallet generation timed out',
          ));
        if (!storedWallet) {
          try {
            await setWallet(wallet);
          } catch {
            // If persistence fails, still continue with the in-memory wallet.
          }
        }

        if (!cancelled) {
          hydrateWallet(wallet);
          setOnboardingComplete(completed);
        }

        // Keep startup responsive; airdrop runs in the background for credits.
        ensureMinimumSolBalance(wallet.publicKey, 5).catch(() => {
          // Ignore faucet/rate-limit failures so app startup flow still works.
        });
      } catch {
        if (!cancelled) {
          hydrateWallet(null);
          setOnboardingComplete(false);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrateWallet, setWallet]);

  const handleOnboardingComplete = async (profile: UserProfile) => {
    await saveUserProfile(profile);

    // Ensure a persisted wallet exists when the user finishes onboarding.
    // If none is stored (e.g. storage was cleared or generation skipped earlier),
    // generate one now, persist it, hydrate the in-memory store, and top-up.
    try {
      const stored = await getWallet();
      if (!stored) {
        const wallet = await withTimeout(
          generateDemoWallet(),
          12_000,
          'Wallet generation timed out',
        );
        try {
          await setWallet(wallet);
        } catch {
          // Ignore persistence failures; still hydrate so the app can continue.
        }
        hydrateWallet(wallet);

        // Kick off background airdrop to keep UX smooth.
        ensureMinimumSolBalance(wallet.publicKey, 5).catch(() => {});
      }
    } catch {
      // Ignore onboarding-time wallet generation errors; still continue to dashboard.
    }

    setOnboardingComplete(true);
  };

  if (!ready) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={tokens.colors.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={tokens.colors.page}
      />
      <View style={styles.debugBanner} pointerEvents="none">
        <Text style={styles.debugBannerText}>DEBUG: APP ROOT MOUNTED</Text>
      </View>
      <AppNavigator
        onboardingComplete={onboardingComplete}
        onOnboardingComplete={handleOnboardingComplete}
      />
    </>
  );
}

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SafeAreaProvider>
          <RootErrorBoundary>
            <AppContent />
          </RootErrorBoundary>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: tokens.colors.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugBanner: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    zIndex: 9999,
    backgroundColor: '#d63333',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  debugBannerText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
  rootErrorContainer: {
    flex: 1,
    backgroundColor: '#2b0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  rootErrorTitle: {
    color: '#ffb4b4',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  rootErrorMessage: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});
