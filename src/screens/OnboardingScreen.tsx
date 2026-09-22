import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {Button, Screen} from '../components/ui';
import {dynamicClient} from '../services/dynamicClient';
import {tokens} from '../theme/tokens';

const OTP_LENGTH = 6;
type AuthMode = 'phone' | 'email';

type OnboardingScreenProps = {
  onContinueWithDynamic: () => Promise<void>;
};

export default function OnboardingScreen({
  onContinueWithDynamic,
}: OnboardingScreenProps): React.JSX.Element {
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [contact, setContact] = useState('');
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleSendOtp = async () => {
    const trimmedContact = contact.trim();
    if (!trimmedContact) {
      setError(authMode === 'email' ? 'Enter your email address.' : 'Enter your phone number.');
      return;
    }

    if (authMode === 'email' && !trimmedContact.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await dynamicClient.auth.email.sendOTP(trimmedContact);
      setOtpSent(true);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to send the verification code.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);

    try {
      await dynamicClient.auth.email.resendOTP();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to resend the verification code.',
      );
    }
  };

  const handleOtpChange = (index: number, rawValue: string) => {
    const sanitized = rawValue.replace(/\D/g, '');
    const pasted = sanitized.length > 1 ? sanitized : null;
    const nextDigits = [...otpDigits];

    if (pasted) {
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        nextDigits[i] = pasted[i] ?? '';
      }
      setOtpDigits(nextDigits);
      const lastFilledIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
      const focusIndex = lastFilledIndex >= 0 ? lastFilledIndex : 0;
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const digit = sanitized.slice(-1);
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otpDigits.join('').trim();
    if (trimmedOtp.length !== OTP_LENGTH) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await dynamicClient.auth.email.verifyOTP(trimmedOtp);
      await onContinueWithDynamic();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to verify the code.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen avoidKeyboard contentStyle={styles.screenContent}>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>$</Text>
        </View>

        <Text style={styles.title}>Altude Pay</Text>
        <Text style={styles.subtitle}>Send, spend, and get paid</Text>

        {!otpSent ? (
          <>
            <View style={styles.segmentedControl}>
              {(['phone', 'email'] as const).map(mode => {
                const selected = authMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setAuthMode(mode)}
                    style={[
                      styles.segment,
                      selected && styles.segmentSelected,
                    ]}>
                    <Text
                      style={[
                        styles.segmentText,
                        selected && styles.segmentTextSelected,
                      ]}>
                      {mode === 'phone' ? 'Phone' : 'Email'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={contact}
              onChangeText={setContact}
              placeholder={authMode === 'email' ? 'Email address' : 'Phone number'}
              keyboardType={authMode === 'email' ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={authMode === 'email' ? 'emailAddress' : 'telephoneNumber'}
              style={styles.input}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={isSubmitting ? 'Sending...' : 'Continue'}
              onPress={handleSendOtp}
              disabled={isSubmitting}
              style={styles.primaryButton}
            />
          </>
        ) : (
          <>
            <Text style={styles.codeTitle}>Verify your code</Text>
            <Text style={styles.codeSubtitle}>
              We sent a 6-digit code to {contact}.
            </Text>

            <View style={styles.codeRow}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={`otp-${index}`}
                  ref={ref => {
                    inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={value => handleOtpChange(index, value)}
                  onKeyPress={({nativeEvent}) => handleOtpKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={1}
                  selectTextOnFocus
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : null,
                  ]}
                  inputMode="numeric"
                  placeholder="0"
                  placeholderTextColor={tokens.color.textMuted}
                />
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={isSubmitting ? 'Verifying...' : 'Verify'}
              onPress={handleVerifyOtp}
              disabled={isSubmitting || otpDigits.join('').length < OTP_LENGTH}
              style={styles.primaryButton}
            />

            <Button
              label="Resend code"
              onPress={handleResendOtp}
              disabled={isSubmitting}
              variant="secondary"
              style={styles.secondaryButton}
            />
          </>
        )}
      </View>

      {isSubmitting ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.color.brand} size="small" />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: tokens.spacing.huge,
    paddingBottom: tokens.spacing.xl,
    gap: tokens.spacing.md,
  },
  logoWrap: {
    width: 78,
    height: 78,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.brandSurface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.color.brand,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 0},
    elevation: 6,
  },
  logo: {
    ...tokens.type.display,
    color: tokens.color.textPrimary,
    fontSize: 34,
    lineHeight: 34,
    textAlign: 'center',
    alignSelf: 'center',
  },
  title: {
    ...tokens.type.display,
    color: tokens.color.textPrimary,
    marginTop: tokens.spacing.xs,
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  subtitle: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    marginBottom: tokens.spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 360,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: tokens.color.surfaceElevated,
  },
  segmentText: {
    ...tokens.type.action,
    color: tokens.color.textSecondary,
  },
  segmentTextSelected: {
    color: tokens.color.textPrimary,
  },
  input: {
    width: '100%',
    maxWidth: 360,
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.borderHairline,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.lg,
    backgroundColor: tokens.color.surface,
    color: tokens.color.textPrimary,
    fontSize: 18,
  },
  error: {
    ...tokens.type.body,
    color: tokens.color.error,
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  codeTitle: {
    ...tokens.type.title,
    color: tokens.color.textPrimary,
    marginBottom: tokens.spacing.xs,
  },
  codeSubtitle: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 360,
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  codeInput: {
    flex: 1,
    height: 52,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.borderHairline,
    color: tokens.color.textPrimary,
    textAlign: 'center',
    ...tokens.type.title,
  },
  codeInputFilled: {
    borderColor: tokens.color.brand,
    backgroundColor: tokens.color.surfaceElevated,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: tokens.spacing.sm,
  },
});