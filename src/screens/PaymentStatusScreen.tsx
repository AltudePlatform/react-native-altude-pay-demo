import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated, {FadeIn, FadeOut, useReducedMotion} from 'react-native-reanimated';

import {AscentIndicator} from '../components/AscentIndicator';
import {GradientBackdrop} from '../components/GradientBackdrop';
import {Stage, StageList} from '../components/StageList';
import {PaymentStage, usePayment} from '../hooks/usePayment';
import {truncateAddress} from '../services/solana';
import {tokens} from '../theme/tokens';
import {RootStackParamList, TransactionRecord} from '../types';

type NavProp = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'PaymentStatus'>;

const STAGES: readonly Stage[] = [
  {key: 'signing', label: 'Approving payment'},
  {key: 'sending', label: 'Sending'},
  {key: 'confirming', label: 'Confirming'},
];

const STAGE_INDEX: Record<PaymentStage, number> = {
  signing: 0,
  sending: 1,
  confirming: 2,
};

export default function PaymentStatusScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const {amount, recipient} = useRoute<RouteType>().params;
  const {mutate: sendPayment} = usePayment();

  const [stageIndex, setStageIndex] = useState(0);
  const [record, setRecord] = useState<TransactionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  const parsedAmount = parseFloat(amount);
  const inFlight = !record && !error;

  useEffect(() => {
    if (started.current === attempt) {
      return;
    }
    started.current = attempt;

    setStageIndex(0);
    setRecord(null);
    setError(null);

    sendPayment(
      {
        recipientAddress: recipient,
        amount: parsedAmount,
        onStage: stage => setStageIndex(STAGE_INDEX[stage]),
      },
      {
        onSuccess: setRecord,
        onError: err => setError((err as Error).message),
      },
    );
  }, [attempt, parsedAmount, recipient, sendPayment]);

  // A payment in flight cannot be cancelled, so block the hardware back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => inFlight);
    return () => sub.remove();
  }, [inFlight]);

  const handleDone = useCallback(() => navigation.navigate('MainTabs'), [navigation]);
  const handleReceipt = useCallback(() => {
    if (record) {
      navigation.navigate('Receipt', {signature: record.signature});
    }
  }, [navigation, record]);
  const handleRetry = useCallback(() => setAttempt(n => n + 1), []);
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const failed = Boolean(error) || record?.status === 'failed';
  const pendingConfirmation = record?.status === 'pending';

  // Honour the OS reduced-motion setting, as AscentIndicator already does.
  const reduceMotion = useReducedMotion();
  const enterDuration = reduceMotion ? 0 : tokens.motion.base;
  const exitDuration = reduceMotion ? 0 : tokens.motion.fast;

  return (
    <View style={styles.root}>
      <GradientBackdrop />
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <AscentIndicator
            progress={inFlight ? 0.2 + stageIndex * 0.3 : 1}
            state={inFlight ? 'active' : failed ? 'error' : 'success'}
          />

          <Animated.View
            key={inFlight ? 'progress' : 'result'}
            entering={FadeIn.duration(enterDuration)}
            exiting={FadeOut.duration(exitDuration)}
            style={styles.copy}>
            <Text style={styles.amount}>{`$${
              isNaN(parsedAmount) ? amount : parsedAmount.toFixed(2)
            }`}</Text>
            <Text style={styles.recipient}>{`to ${truncateAddress(recipient, 6)}`}</Text>

            {inFlight ? null : (
              <>
                <Text style={styles.title}>
                  {failed
                    ? "Payment didn't go through"
                    : pendingConfirmation
                      ? 'Payment sent'
                      : 'Payment confirmed'}
                </Text>
                <Text style={styles.subtitle}>
                  {failed
                    ? error ?? 'The network rejected this payment.'
                    : pendingConfirmation
                      ? 'It is taking a little longer to confirm. You can track it in your activity.'
                      : 'The money has arrived.'}
                </Text>
              </>
            )}
          </Animated.View>

          {/* Announce stage changes; previously progress was visual only. */}
          {inFlight ? (
            <View accessibilityLiveRegion="polite">
              <StageList stages={STAGES} activeIndex={stageIndex} />
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          {inFlight ? (
            <Text style={styles.footerHint}>Keep the app open</Text>
          ) : failed ? (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry}>
                <Text style={styles.primaryBtnText}>Try again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleBack}>
                <Text style={styles.secondaryBtnText}>Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleDone}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleReceipt}>
                <Text style={styles.secondaryBtnText}>View receipt</Text>
              </TouchableOpacity>
            </>
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
    gap: tokens.spacing.xs,
  },
  amount: {
    ...tokens.type.display,
    fontSize: 40,
    lineHeight: 46,
    color: tokens.color.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  recipient: {
    ...tokens.type.label,
    color: tokens.color.textMuted,
  },
  title: {
    ...tokens.type.title,
    marginTop: tokens.spacing.md,
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
    gap: tokens.spacing.sm,
  },
  footerHint: {
    ...tokens.type.eyebrow,
    letterSpacing: 3,
    color: tokens.color.textMuted,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: tokens.color.brandSurface,
    borderRadius: tokens.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...tokens.type.action,
    color: tokens.color.textPrimary,
  },
  secondaryBtn: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    minHeight: tokens.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...tokens.type.body,
    fontWeight: '700',
    color: tokens.color.textSecondary,
  },
});
