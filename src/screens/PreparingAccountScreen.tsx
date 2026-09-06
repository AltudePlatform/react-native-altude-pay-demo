import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated, {FadeIn, FadeOut, useReducedMotion} from 'react-native-reanimated';

import {AscentIndicator} from '../components/AscentIndicator';
import {GradientBackdrop} from '../components/GradientBackdrop';
import {tokens} from '../theme/tokens';
import {UserProfile} from '../types';

type PreparingAccountScreenProps = {
  profile: UserProfile;
  onPrepare: (profile: UserProfile) => Promise<void>;
};

const REASSURANCE = ['Setting up your account', 'Almost ready'] as const;

export default function PreparingAccountScreen({
  profile,
  onPrepare,
}: PreparingAccountScreenProps): React.JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState(0);

  const handleContinueWithDynamic = useCallback(() => {
    setError(null);
    setStep(0);
    setIsConnecting(true);

    onPrepare(profile).catch((err: unknown) => {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong on our side.',
      );
      setIsConnecting(false);
    });
  }, [onPrepare, profile]);

  useEffect(() => {
    if (error || !isConnecting) {
      return;
    }

    const timer = setTimeout(
      () => setStep(current => Math.min(current + 1, REASSURANCE.length - 1)),
      3_000,
    );
    return () => clearTimeout(timer);
  }, [error, isConnecting, step]);

  const reduceMotion = useReducedMotion();
  const enterDuration = reduceMotion ? 0 : tokens.motion.base;
  const exitDuration = reduceMotion ? 0 : tokens.motion.fast;

  return (
    <View style={styles.root}>
      <GradientBackdrop />
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <AscentIndicator
            progress={error ? 1 : 0.35 + step * 0.35}
            state={error ? 'error' : 'active'}
          />

          {error ? (
            <Animated.View entering={FadeIn.duration(enterDuration)} style={styles.copy}>
              <Text style={styles.title}>We couldn't finish setting up</Text>
              <Text style={styles.subtitle}>{error}</Text>
            </Animated.View>
          ) : (
            <Animated.View
              key={step}
              entering={FadeIn.duration(enterDuration)}
              exiting={FadeOut.duration(exitDuration)}
              style={styles.copy}
              accessibilityLiveRegion="polite">
              <Text style={styles.title}>
                {isConnecting ? REASSURANCE[step] : 'Secure your wallet'}
              </Text>
              <Text style={styles.subtitle}>
                {isConnecting
                  ? 'Keep the app open while Dynamic connects your wallet.'
                  : 'Continue with Dynamic to create or connect your wallet.'}
              </Text>
            </Animated.View>
          )}
        </View>

        <View style={styles.footer}>
          {error ? (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={handleContinueWithDynamic}>
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          ) : !isConnecting ? (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={handleContinueWithDynamic}>
              <Text style={styles.retryBtnText}>Continue with Dynamic</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.footerHint}>ALTUDE PAY</Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.gradient.heroMid,
  },
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xl,
    gap: tokens.spacing.xl,
  },
  copy: {
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  title: {
    ...tokens.type.title,
    color: tokens.color.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xl,
    alignItems: 'center',
  },
  footerHint: {
    ...tokens.type.eyebrow,
    letterSpacing: 3,
    color: tokens.color.textMuted,
  },
  retryBtn: {
    alignSelf: 'stretch',
    backgroundColor: tokens.color.brandSurface,
    borderRadius: tokens.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryBtnText: {
    ...tokens.type.action,
    color: tokens.color.textPrimary,
  },
});
