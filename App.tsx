/**
 * AltudePay – Solana USDC Payment Demo
 *
 * Entry point. Hydrates persisted client state on startup,
 * then delegates to the navigation tree.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {StatusBar, View, ActivityIndicator, StyleSheet, Text} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import {ToastProvider} from './src/components/ui/Toast';
import {
  ensureClientState,
  clearUserProfile,
  getWallet,
  getUserProfile,
  hasCompletedOnboarding,
  saveUserProfile,
} from './src/services/storage';
import {useWalletStore} from './src/store/walletStore';
import {UserProfile} from './src/types';
import {tokens} from './src/theme/tokens';
import {ensureDemoAccount} from './src/services/accountBootstrap';

const SHOW_STARTUP_DIAGNOSTICS = false;

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

        if (!cancelled) {
          // Hydrate quickly from disk and let screen-level background tasks
          // handle wallet creation so first render is not blocked.
          hydrateWallet(storedWallet);
          setOnboardingComplete(completed);
        }
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

  const handleOnboardingComplete = useCallback(
    async (profile: UserProfile) => {
      const existingProfile = await getUserProfile();
      if (!existingProfile) {
        await saveUserProfile(profile);
      }

      // Let failures surface so the Preparing screen can offer a retry.
      const wallet = await withTimeout(
        ensureDemoAccount(),
        12_000,
        'Setting up your account took too long. Check your connection and try again.',
      );
      hydrateWallet(wallet);

      setOnboardingComplete(true);
    },
    [hydrateWallet],
  );

  const handleLogout = async () => {
    await Promise.all([clearUserProfile(), useWalletStore.getState().removeWallet()]);
    setOnboardingComplete(false);
  };

  if (!ready) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={tokens.color.brand} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={tokens.color.canvas}
      />
      {SHOW_STARTUP_DIAGNOSTICS ? <View style={styles.diagBanner} /> : null}
      <AppNavigator
        onboardingComplete={onboardingComplete}
        onOnboardingComplete={handleOnboardingComplete}
        onLogout={handleLogout}
      />
    </>
  );
}

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SafeAreaProvider>
          <ToastProvider>
            <RootErrorBoundary>
              <AppContent />
            </RootErrorBoundary>
          </ToastProvider>
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
    backgroundColor: tokens.color.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootErrorContainer: {
    flex: 1,
    backgroundColor: tokens.color.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.layout.gutter,
  },
  rootErrorTitle: {
    ...tokens.type.title,
    color: tokens.color.error,
    marginBottom: tokens.spacing.md,
  },
  rootErrorMessage: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  diagBanner: {
    backgroundColor: tokens.color.surface,
    borderBottomWidth: tokens.border.strong,
    borderBottomColor: tokens.color.borderHairline,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
});
