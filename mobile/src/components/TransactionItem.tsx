import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking} from 'react-native';
import {TransactionRecord} from '../types';
import {truncateAddress} from '../services/solana';

interface Props {
  record: TransactionRecord;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#14F195',
  pending: '#FFB800',
  failed: '#FF6B6B',
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: '✓ Confirmed',
  pending: '⏳ Pending',
  failed: '✗ Failed',
};

export default function TransactionItem({record}: Props): React.JSX.Element {
  const date = new Date(record.date);
  const statusColor = STATUS_COLORS[record.status] ?? '#888';
  const statusLabel = STATUS_LABELS[record.status] ?? record.status;

  const handleViewExplorer = () => {
    const url = `https://explorer.solana.com/tx/${record.signature}?cluster=devnet`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.recipient}>
            {truncateAddress(record.recipient)}
          </Text>
          <Text style={styles.date}>
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </Text>
          {record.memo ? (
            <Text style={styles.memo}>{record.memo}</Text>
          ) : null}
        </View>

        <View style={styles.right}>
          <Text style={styles.amount}>-{record.amount} USDC</Text>
          <Text style={[styles.status, {color: statusColor}]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={handleViewExplorer} style={styles.sigRow}>
        <Text style={styles.sig}>{truncateAddress(record.signature, 8)}</Text>
        <Text style={styles.explorerLink}>View ↗</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  info: {flex: 1},
  recipient: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  date: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  memo: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  right: {alignItems: 'flex-end'},
  amount: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '700',
  },
  status: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2d2d44',
    paddingTop: 8,
    marginTop: 4,
  },
  sig: {
    color: '#555',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  explorerLink: {
    color: '#9945FF',
    fontSize: 11,
  },
});
