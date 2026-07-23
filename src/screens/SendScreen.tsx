import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';

import {usePayment} from '../hooks/usePayment';
import {getRecentRecipients, getUserPreferences} from '../services/storage';
import {isValidSolanaAddress, truncateAddress} from '../services/solana';
import {useWalletStore} from '../store/walletStore';
import {MainTabParamList, TransactionRecord} from '../types';

type NavProp = BottomTabNavigationProp<MainTabParamList, 'Send'>;
type RoutePropType = RouteProp<MainTabParamList, 'Send'>;

export default function SendScreen(): React.JSX.Element {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavProp>();

  const [recipient, setRecipient] = useState(route.params?.recipient ?? '');
  const [amount, setAmount] = useState(route.params?.amount ?? '');
  const [memo, setMemo] = useState('');
  const [recentRecipients, setRecentRecipients] = useState<string[]>([]);

  const wallet = useWalletStore(s => s.wallet);
  const {mutate: sendPayment, isPending} = usePayment();

  useEffect(() => {
    getRecentRecipients().then(setRecentRecipients);
  }, []);

  const validate = useCallback((): string | null => {
    if (!wallet) {return 'No wallet connected. Go to Home to generate a wallet.';}
    if (!isValidSolanaAddress(recipient)) {return 'Invalid recipient address.';}
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {return 'Enter a valid amount greater than 0.';}
    if (recipient === wallet.publicKey) {return 'Cannot send to your own wallet.';}
    return null;
  }, [wallet, recipient, amount]);

  const handlePaymentSuccess = useCallback(
    async (record: TransactionRecord) => {
      setRecentRecipients(await getRecentRecipients());
      setRecipient('');
      setAmount('');
      setMemo('');

      if (record.status === 'confirmed') {
        Alert.alert(
          '✅ Payment Confirmed',
          `Transaction confirmed on Solana.\n\nSignature:\n${record.signature.slice(0, 20)}...`,
          [{text: 'OK', onPress: () => navigation.navigate('History')}],
        );
        return;
      }

      Alert.alert(
        '⏳ Payment Submitted',
        `Broadcast complete. Confirmation is still pending on Solana.\n\nSignature:\n${record.signature.slice(0, 20)}...`,
        [{text: 'OK', onPress: () => navigation.navigate('History')}],
      );
    },
    [navigation],
  );

  const submitPayment = useCallback(
    (amt: number) => {
      sendPayment(
        {recipientAddress: recipient, amount: amt, memo: memo || undefined},
        {
          onSuccess: record => {
            handlePaymentSuccess(record).catch(() => {
              Alert.alert('Error', 'Payment succeeded, but the UI could not update.');
            });
          },
          onError: err => {
            Alert.alert('Payment Failed', (err as Error).message);
          },
        },
      );
    },
    [handlePaymentSuccess, memo, recipient, sendPayment],
  );

  const handleSend = useCallback(async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    const amt = parseFloat(amount);
    const preferences = await getUserPreferences();

    if (!preferences.confirmBeforeSending) {
      submitPayment(amt);
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Send ${amt} USDC to\n${recipient.slice(0, 8)}...${recipient.slice(-8)}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Send',
          onPress: () => submitPayment(amt),
        },
      ],
    );
  }, [amount, recipient, submitPayment, validate]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Send USDC</Text>
        <Text style={styles.subtitle}>Client-first flow with Solana RPC confirmation</Text>

        <View style={styles.form}>
          {recentRecipients.length > 0 ? (
            <>
              <Text style={styles.label}>Recent Recipients</Text>
              <View style={styles.recipientList}>
                {recentRecipients.map(address => (
                  <TouchableOpacity
                    key={address}
                    style={styles.recipientChip}
                    onPress={() => setRecipient(address)}>
                    <Text style={styles.recipientChipText}>
                      {truncateAddress(address, 4)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Solana wallet address (Base58)"
            placeholderTextColor="#666"
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />

          <Text style={styles.label}>Amount (USDC)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Memo (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Payment memo"
            placeholderTextColor="#666"
            value={memo}
            onChangeText={setMemo}
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.sendBtn, isPending && styles.sendBtnDisabled]}
            onPress={() => {
              handleSend().catch(() => {
                Alert.alert('Error', 'Could not start the payment flow.');
              });
            }}
            disabled={isPending}>
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>Send Payment</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('QR')}>
            <Text style={styles.scanBtnText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9945FF',
    fontSize: 13,
    marginBottom: 32,
  },
  form: {
    gap: 4,
  },
  label: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  recipientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  recipientChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3a3a55',
    backgroundColor: '#1a1a2e',
  },
  recipientChipText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: '#1e1e30',
    borderWidth: 1,
    borderColor: '#3a3a55',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#9945FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  scanBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#3a3a55',
  },
  scanBtnText: {
    color: '#888',
    fontSize: 15,
  },
});
