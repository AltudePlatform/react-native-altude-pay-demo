/**
 * AltudePay – Solana USDC Payment Demo
 *
 * Entry point. Hydrates persisted client state on startup,
 * then delegates to the navigation tree.
 */

import React, {useCallback, useEffect, useState} from 'react';

import {SafeAreaProvider} from 'react-native-safe-area-context';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import {
  StatusBar,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';

import {GestureHandlerRootView} from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';

import {ToastProvider} from './src/components/ui/Toast';

import {
  ensureClientState,
  getWallet,
  hasCompletedOnboarding,
  getWalletByIdentity,
  saveWalletForUser,
  saveUserProfile,
  logout,
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

  static getDerivedStateFromError(
    error: Error,
  ): RootErrorBoundaryState {
    return {
      errorMessage:
        error?.message || 'Unknown render error',
    };
  }

  componentDidCatch(error: Error): void {
    console.error(
      'RootErrorBoundary caught error:',
      error,
    );
  }

  render(): React.ReactNode {
    if (this.state.errorMessage) {
      return (
        <View style={styles.rootErrorContainer}>
          <Text style={styles.rootErrorTitle}>
            Render Error
          </Text>

          <Text style={styles.rootErrorMessage}>
            {this.state.errorMessage}
          </Text>
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
  const hydrateWallet = useWalletStore(
    state => state.hydrate,
  );

  const [ready, setReady] = useState(false);

  const [onboardingComplete, setOnboardingComplete] =
    useState(false);

  /**
   * Hydrate the active session on application startup.
   *
   * IMPORTANT:
   *
   * We only restore WALLET here if there is an active
   * wallet stored locally.
   *
   * USER_WALLETS contains logged-out users' wallets and
   * should NOT automatically log the user back in.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await ensureClientState();

        const [storedWallet, completed] =
          await Promise.all([
            getWallet(),
            hasCompletedOnboarding(),
          ]);

        if (!cancelled) {
          hydrateWallet(storedWallet);
          setOnboardingComplete(completed);
        }
      } catch (error) {
        console.error(
          'Failed to hydrate client state:',
          error,
        );

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
  }, [hydrateWallet]);

  /**
   * Called when the user finishes the login/onboarding screen.
   *
   * Flow:
   *
   * 1. Check whether this phone/email already owns a wallet.
   * 2. If yes, restore that wallet.
   * 3. If no, create a new wallet.
   * 4. Associate the new wallet with the user's identity.
   * 5. Save the profile.
   */
  const handleOnboardingComplete = useCallback(
    async (profile: UserProfile) => {
      /**
       * First check whether this user already has
       * a wallet associated with their phone/email.
       */
      const existingWallet =
        await getWalletByIdentity({
          countryCode: profile.countryCode,
          phoneNumber: profile.phoneNumber,
          email: profile.email,
        });

      /**
       * Existing user:
       *
       * Restore their existing wallet.
       */
      if (existingWallet) {
        await saveUserProfile(profile);

        await useWalletStore.getState().setWallet(existingWallet);

        setOnboardingComplete(true);

        return;
      }

      /**
       * New user:
       *
       * Create a brand-new wallet.
       */
      const wallet = await withTimeout(
        ensureDemoAccount(profile),
        12_000,
        'Setting up your account took too long. Check your connection and try again.',
      );

      /**
       * Save the profile.
       */
      await saveUserProfile(profile);

      /**
       * Associate the newly-created wallet with the
       * user's phone/email.
       *
       * This is what allows the same wallet to be restored
       * after logout.
       */
      await saveWalletForUser(
        {
          countryCode: profile.countryCode,
          phoneNumber: profile.phoneNumber,
          email: profile.email,
        },
        wallet,
        profile,
      );

      /**
       * Set the wallet as the active wallet in Zustand.
       *
       * saveWalletForUser() stores the wallet under the
       * identity, but does not make it the active wallet.
       */
      hydrateWallet(wallet);

      setOnboardingComplete(true);
    },
    [hydrateWallet],
  );

  /**
   * Logout the current user.
   *
   * storage.logout():
   *
   * 1. Gets the active profile.
   * 2. Gets the active wallet.
   * 3. Preserves wallet → identity.
   * 4. Clears active wallet.
   * 5. Clears active profile.
   * 6. Clears user-specific history/recipients.
   *
   * The wallet itself remains stored in USER_WALLETS.
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();

      /**
       * Clear the Zustand wallet state as well.
       *
       * We don't call removeWallet() here because storage.logout()
       * already removed the persisted active wallet.
       */
      hydrateWallet(null);

      setOnboardingComplete(false);
    } catch (error) {
      console.error(
        'Failed to logout:',
        error,
      );
    }
  }, [hydrateWallet]);

  if (!ready) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          color={tokens.color.brand}
          size="large"
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={tokens.color.canvas}
      />

      {SHOW_STARTUP_DIAGNOSTICS ? (
        <View style={styles.diagBanner} />
      ) : null}

      <AppNavigator
        onboardingComplete={onboardingComplete}
        onOnboardingComplete={
          handleOnboardingComplete
        }
        onLogout={handleLogout}
      />
    </>
  );
}

export default function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView
        style={styles.gestureRoot}
      >
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