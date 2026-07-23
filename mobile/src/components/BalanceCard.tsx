import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';

interface Props {
  solBalance: number;
  usdcBalance: number;
  isLoading: boolean;
}

export default function BalanceCard({
  solBalance,
  usdcBalance,
  isLoading,
}: Props): React.JSX.Element {
  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color="#9945FF" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Portfolio</Text>

      <View style={styles.row}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>USDC</Text>
          <Text style={styles.balanceValue}>
            {usdcBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.balanceCurrency}>USDC</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>SOL</Text>
          <Text style={styles.balanceValue}>
            {solBalance.toLocaleString('en-US', {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}
          </Text>
          <Text style={styles.balanceCurrency}>SOL</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  loadingCard: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  balanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  balanceLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  balanceCurrency: {
    color: '#9945FF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: '#2d2d44',
  },
});
