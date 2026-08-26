import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, Pressable, StyleSheet, Alert} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import {useBalance} from '../hooks/useBalance';
import {InsufficientBalanceNotice} from '../components/InsufficientBalanceNotice';
import {getRecentRecipients, getUserPreferences} from '../services/storage';
import {isValidSolanaAddress, truncateAddress} from '../services/solana';
import {useWalletStore} from '../store/walletStore';
import {formatUsd} from '../utils/format';
import {
  BalanceDisplay,
  Button,
  Field,
  Screen,
  ScreenHeader,
  useToast,
} from '../components/ui';
import {RootStackParamList} from '../types';
import {tokens} from '../theme/tokens';

type NavProp = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'PayAddress'>;
const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111';

export default function PayAddressScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const {showToast} = useToast();

  const wallet = useWalletStore(s => s.wallet);
  const {data: balance, isLoading: isBalanceLoading} = useBalance();
  const availableBalance = balance?.usdcBalance;

  const [recipient, setRecipient] = useState(route.params.recipient ?? '');
  const [recentRecipients, setRecentRecipients] = useState<string[]>([]);

  const amount = route.params.amount;
  const parsedAmount = useMemo(() => parseFloat(amount), [amount]);
  const exceedsBalance =
    availableBalance !== undefined && parsedAmount > availableBalance;

  useEffect(() => {
    getRecentRecipients().then(setRecentRecipients);
  }, []);

  const handlePasteRecipient = useCallback(async () => {
    const text = (await Clipboard.getString()).trim().slice(0, 44);
    if (!text) {
      showToast('Clipboard is empty', 'error');
      return;
    }

    setRecipient(text);
  }, [showToast]);

  /**
   * Surfaced inline as the address is typed rather than only as an alert on
   * submit, so the problem is visible where it can be fixed.
   */
  const recipientError = useMemo(() => {
    if (recipient.length === 0) {
      return null;
    }
    if (!isValidSolanaAddress(recipient)) {
      return 'This is not a valid Solana address.';
    }
    if (recipient === SYSTEM_PROGRAM_ADDRESS) {
      return 'Enter a wallet address, not the Solana system-program address.';
    }
    if (wallet && recipient === wallet.publicKey) {
      return 'You cannot send to your own account.';
    }
    return null;
  }, [recipient, wallet]);

  const recipientValid = recipient.length > 0 && recipientError === null;

  const validate = useCallback((): string | null => {
    if (!wallet) {
      return 'No account connected. Go to Home to create one.';
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return 'Amount is invalid. Return to Pay and enter a valid amount.';
    }

    if (availableBalance === undefined) {
      return 'Your balance has not loaded yet. Wait a moment and try again.';
    }

    if (parsedAmount > availableBalance) {
      return `You only have ${formatUsd(
        availableBalance,
      )} available. Enter a smaller amount.`;
    }

    return recipientError ?? (recipient.length === 0 ? 'Enter a recipient address.' : null);
  }, [availableBalance, parsedAmount, recipient, recipientError, wallet]);

  const handleSubmit = useCallback(async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    const preferences = await getUserPreferences();

    const submit = () => navigation.navigate('PaymentStatus', {amount, recipient});

    if (!preferences.confirmBeforeSending) {
      submit();
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Send ${formatUsd(parsedAmount)} to\n${recipient.slice(0, 8)}...${recipient.slice(
        -8,
      )}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Send', onPress: submit},
      ],
    );
  }, [amount, navigation, parsedAmount, recipient, validate]);

  return (
    <Screen scroll avoidKeyboard>
      {/* Back moved into the header; it used to sit beside "Scan QR" as if it
          were an equal action. */}
      <ScreenHeader onBack={() => navigation.goBack()} />

      <BalanceDisplay
        label="Paying"
        value={`$${amount}`}
        meta={
          isBalanceLoading || availableBalance === undefined
            ? 'Checking your balance…'
            : `${formatUsd(availableBalance)} available`
        }
      />

      <View style={styles.form}>
        {recentRecipients.length > 0 ? (
          <View style={styles.recents}>
            <Text style={styles.label}>Recent people</Text>
            <View style={styles.chipRow}>
              {recentRecipients.map(address => (
                <Pressable
                  key={address}
                  onPress={() => setRecipient(address)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use recipient ${truncateAddress(address, 4)}`}
                  style={({pressed}) => [styles.chip, pressed && styles.chipPressed]}>
                  <Text style={styles.chipText}>{truncateAddress(address, 4)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Field
          label="Recipient address"
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Paste or scan a Solana address"
          mono
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          error={recipientError}
          hint={recipientValid ? 'Valid Solana address' : null}
          accessory={
            <Pressable
              onPress={handlePasteRecipient}
              accessibilityRole="button"
              accessibilityLabel="Paste address from clipboard"
              hitSlop={8}
              style={({pressed}) => [styles.paste, pressed && styles.chipPressed]}>
              <Text style={styles.pasteText}>Paste</Text>
            </Pressable>
          }
        />

        <Button
          label="Scan QR code"
          icon="scan"
          variant="secondary"
          onPress={() => navigation.navigate('Scan')}
        />

        {exceedsBalance && availableBalance !== undefined ? (
          <InsufficientBalanceNotice available={availableBalance} />
        ) : null}

        <Button
          label="Pay"
          onPress={() => {
            handleSubmit().catch(() => {
              Alert.alert('Error', 'Could not start the payment flow.');
            });
          }}
          disabled={exceedsBalance || !recipientValid}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: tokens.spacing.xxxl,
    gap: tokens.spacing.xl,
  },
  recents: {
    gap: tokens.spacing.md,
  },
  label: {
    ...tokens.type.label,
    color: tokens.color.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  chip: {
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.lg,
    minHeight: tokens.layout.touchTarget,
    justifyContent: 'center',
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.surface,
  },
  chipPressed: {
    backgroundColor: tokens.color.surfaceElevated,
  },
  chipText: {
    ...tokens.type.mono,
    color: tokens.color.textPrimary,
  },
  paste: {
    minHeight: tokens.layout.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
    marginRight: -tokens.spacing.md,
    borderRadius: tokens.radius.sm,
  },
  pasteText: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.color.brand,
  },
});
