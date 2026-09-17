import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Button, Screen} from '../components/ui';
import {tokens} from '../theme/tokens';

type OnboardingScreenProps = {
  onContinueWithDynamic: () => Promise<void>;
};

export default function OnboardingScreen({
  onContinueWithDynamic,
}: OnboardingScreenProps): React.JSX.Element {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await onContinueWithDynamic();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>ALTUDE PAY</Text>
        <Text style={styles.title}>Pay with USDC</Text>
        <Text style={styles.subtitle}>
          Log in or create an account to access your secure wallet.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Button
        label={isConnecting ? 'Opening Dynamic...' : 'Log in or register'}
        onPress={handleContinue}
        disabled={isConnecting}
        style={styles.continue}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: tokens.spacing.md,
  },
  eyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.color.textMuted,
  },
  title: {
    ...tokens.type.display,
    color: tokens.color.textPrimary,
  },
  subtitle: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
  },
  error: {
    ...tokens.type.body,
    color: tokens.color.error,
  },
  continue: {
    marginBottom: tokens.spacing.xl,
  },
});