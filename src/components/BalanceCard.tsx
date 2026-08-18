import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {tokens} from '../theme/tokens';

interface Props {
  walletAddress?: string;
  usdcBalance: number;
  isLoading: boolean;
}

export default function BalanceCard({
  walletAddress,
  usdcBalance,
  isLoading,
}: Props): React.JSX.Element {
  const handleCopyAddress = () => {
    if (!walletAddress) {
      return;
    }

    Clipboard.setString(walletAddress);
    Alert.alert('Copied', 'Payment address copied to clipboard.');
  };

  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={tokens.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Balance</Text>
          <Text style={styles.cardHint}>Available</Text>
        </View>
        {walletAddress ? (
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyAddress}>
            <Text style={styles.copyBtnText}>Copy Address</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.singleBalanceWrap}>
        <Text style={styles.balanceValue}>
          {`$${usdcBalance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  loadingCard: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardHint: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  copyBtn: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.page,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  copyBtnText: {
    color: tokens.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  singleBalanceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  balanceValue: {
    color: tokens.colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  balanceCurrency: {
    color: tokens.colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
