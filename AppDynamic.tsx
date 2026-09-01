import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

import {ToastProvider} from './src/components/ui/Toast';
import AppNavigator from './src/navigation/AppNavigator';
import {dynamicClient} from './src/services/dynamicClient';
import {
  ensureClientState,
  logout,
} from './src/services/storage';
import {useWalletStore} from './src/store/walletStore';
import {tokens} from './src/theme/tokens';

type DynamicUserProfile = NonNullable<
  typeof dynamicClient.auth.authenticatedUser
>;
const DynamicWebView = dynamicClient.reactNative.WebView;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {retry: 2, staleTime: 10_000},
  },
});

type RootErrorBoundaryState = {errorMessage: string | null};

class RootErrorBoundary extends React.Component<
  {children: React.ReactNode},
  RootErrorBoundaryState
> {
  state: RootErrorBoundaryState = {errorMessage: null};

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return {errorMessage: error?.message || 'Unknown render error'};
  }

  componentDidCatch(error: Error): void {
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

function AppContent(): React.JSX.Element {
  const hydrateWallet = useWalletStore(state => state.hydrate);
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const syncingUserId = useRef<string | null>(null);

  const clearLocalSession = useCallback(async () => {
    await logout();
    hydrateWallet(null);
    setOnboardingComplete(false);
  }, [hydrateWallet]);

  const syncDynamicUser = useCallback(async (dynamicUser: DynamicUserProfile) => {
    const syncKey =
      dynamicUser.userId ?? dynamicUser.email ?? dynamicUser.phoneNumber;

    if (syncKey && syncingUserId.current === syncKey) {
      return;
    }

    syncingUserId.current = syncKey ?? null;

    try {
      const dynamicWallet = [
        dynamicClient.wallets.primary,
        ...dynamicClient.wallets.userWallets,
      ].find(candidate => candidate?.chain.toLowerCase() === 'sol');

      if (!dynamicWallet) {
        throw new Error(
          'No Dynamic Solana wallet is available. Enable a Solana embedded wallet in Dynamic, then try again.',
        );
      }

      hydrateWallet({
        publicKey: dynamicWallet.address,
        provider: 'dynamic',
      });
      setOnboardingComplete(true);
    } catch (error) {
      syncingUserId.current = null;
      throw error;
    }
  }, [hydrateWallet]);

  useEffect(() => {
    let cancelled = false;

    const handleAuthenticatedUserChanged = (user: DynamicUserProfile | null) => {
      if (cancelled) {
        return;
      }

      if (!user) {
        syncingUserId.current = null;
        clearLocalSession().catch(error => {
          console.error('Failed to clear the local session:', error);
        });
        return;
      }

      syncDynamicUser(user).catch(error => {
        console.error('Failed to initialize the Dynamic user:', error);
      });
    };

    dynamicClient.auth.on(
      'authenticatedUserChanged',
      handleAuthenticatedUserChanged,
    );

    (async () => {
      try {
        await ensureClientState();
        await dynamicClient.sdk.waitForReady();

        if (cancelled) {
          return;
        }

        const user = dynamicClient.auth.authenticatedUser;

        if (user) {
          await syncDynamicUser(user);
        } else {
          hydrateWallet(null);
          setOnboardingComplete(false);
        }
      } catch (error) {
        console.error('Failed to initialize Dynamic:', error);
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      dynamicClient.auth.off(
        'authenticatedUserChanged',
        handleAuthenticatedUserChanged,
      );
    };
  }, [clearLocalSession, hydrateWallet, syncDynamicUser]);

  const handleOnboardingComplete = useCallback(async () => {
    await dynamicClient.ui.auth.show();
    const user = await dynamicClient.auth.waitForAuthSuccess();
    await syncDynamicUser(user);
  }, [syncDynamicUser]);

  const handleLogout = useCallback(async () => {
    try {
      await dynamicClient.auth.logout();
      syncingUserId.current = null;
      await clearLocalSession();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, [clearLocalSession]);

  return (
    <>
      <DynamicWebView />
      <StatusBar
        barStyle="light-content"
        backgroundColor={tokens.color.canvas}
      />
      {!ready ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={tokens.color.brand} size="large" />
        </View>
      ) : (
        <AppNavigator
          onboardingComplete={onboardingComplete}
          onOnboardingComplete={handleOnboardingComplete}
          onLogout={handleLogout}
        />
      )}
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
  gestureRoot: {flex: 1},
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
});