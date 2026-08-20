import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

import {useBalance} from '../hooks/useBalance';
import {InsufficientBalanceNotice} from '../components/InsufficientBalanceNotice';
import {getRecentRecipients, getUserPreferences} from '../services/storage';
import {isValidSolanaAddress, truncateAddress} from '../services/solana';
import {useWalletStore} from '../store/walletStore';
import {RootStackParamList} from '../types';
import {tokens} from '../theme/tokens';

type NavProp = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'PayAddress'>;
const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111';

export default function PayAddressScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();

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
    const text = (await Clipboard.getString()).trim();
    if (!text) {
      Alert.alert('Clipboard is empty', 'Copy an address and try again.');
      return;
    }

    setRecipient(text);
  }, []);

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
      return `You only have $${availableBalance.toFixed(
        2,
      )} available. Enter a smaller amount.`;
    }

    if (!isValidSolanaAddress(recipient)) {
      return 'Enter a valid recipient address.';
    }

    if (recipient === SYSTEM_PROGRAM_ADDRESS) {
      return 'Enter a wallet address, not the Solana system-program address.';
    }

    if (recipient === wallet.publicKey) {
      return 'You cannot send to your own account.';
    }

    return null;
  }, [availableBalance, parsedAmount, recipient, wallet]);

  const handleSubmit = useCallback(async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    const preferences = await getUserPreferences();

    const submit = () =>
      navigation.navigate('PaymentStatus', {amount, recipient});

    if (!preferences.confirmBeforeSending) {
      submit();
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Send $${parsedAmount.toFixed(2)} to\n${recipient.slice(0, 8)}...${recipient.slice(-8)}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Send', onPress: submit},
      ],
    );
  }, [amount, navigation, parsedAmount, recipient, validate]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill} width="110%" height="110%">
          <Defs>
            <LinearGradient id="payAddressHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#3f8cff" />
              <Stop offset="55%" stopColor="#4f7ef4" />
              <Stop offset="100%" stopColor="#6d5ce8" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#payAddressHeroGradient)" />
        </Svg>

        <Text style={styles.kicker}>PAY TO</Text>
        <Text style={styles.amount}>{`$${amount}`}</Text>
        <Text style={styles.heroHint}>
          {isBalanceLoading || availableBalance === undefined
            ? 'Checking your balance…'
            : `$${availableBalance.toFixed(2)} available`}
        </Text>
      </View>

      <View style={styles.form}>
        {recentRecipients.length > 0 ? (
          <>
            <Text style={styles.label}>Recent People</Text>
            <View style={styles.recipientList}>
              {recentRecipients.map(address => (
                <TouchableOpacity
                  key={address}
                  style={styles.recipientChip}
                  onPress={() => setRecipient(address)}>
                  <Text style={styles.recipientChipText}>{truncateAddress(address, 4)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.rowHeader}>
          <Text style={styles.label}>Recipient Address</Text>
          <View style={styles.rowHeaderActions}>
            <TouchableOpacity onPress={handlePasteRecipient}>
              <Text style={styles.pasteText}>Paste</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Recipient address"
          placeholderTextColor={tokens.colors.textMuted}
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Scan')}>
            <Text style={styles.secondaryBtnText}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Back</Text>
          </TouchableOpacity>
        </View>

        {exceedsBalance && availableBalance !== undefined ? (
          <InsufficientBalanceNotice available={availableBalance} />
        ) : null}

        <TouchableOpacity
          style={[styles.payBtn, exceedsBalance && styles.payBtnDisabled]}
          onPress={() => {
            handleSubmit().catch(() => {
              Alert.alert('Error', 'Could not start the payment flow.');
            });
          }}
          disabled={exceedsBalance}>
          <Text style={styles.payBtnText}>Pay</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.page,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  hero: {
    minHeight: 140,
    borderRadius: tokens.radius.lg,
    marginBottom: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  kicker: {
    ...tokens.type.eyebrow,
    color: tokens.onAccent.secondary,
  },
  amount: {
    ...tokens.type.display,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '900',
    color: tokens.onAccent.primary,
    marginTop: 6,
  },
  heroHint: {
    ...tokens.type.label,
    color: tokens.onAccent.secondary,
    marginTop: 6,
  },
  form: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  label: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  rowHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  populateText: {
    ...tokens.type.caption,
    fontWeight: '700',
    color: tokens.colors.accent,
  },
  pasteText: {
    ...tokens.type.label,
    fontWeight: '800',
    color: tokens.colors.accent,
  },
  recipientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  recipientChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.card,
  },
  recipientChipText: {
    ...tokens.type.mono,
    color: tokens.colors.textPrimary,
  },
  input: {
    ...tokens.type.body,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: tokens.colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: tokens.colors.page,
  },
  secondaryBtnText: {
    ...tokens.type.body,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  payBtn: {
    backgroundColor: tokens.colors.accent,
    borderRadius: tokens.radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 14,
  },
  payBtnDisabled: {
    opacity: 0.5,
  },
  payBtnText: {
    ...tokens.type.action,
    color: tokens.onAccent.primary,
  },
});