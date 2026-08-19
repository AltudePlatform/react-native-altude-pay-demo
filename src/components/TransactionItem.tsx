import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TransactionRecord} from '../types';
import {truncateAddress} from '../services/solana';
import {tokens} from '../theme/tokens';

interface Props {
  record: TransactionRecord;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: tokens.colors.success,
  pending: '#bb7d18',
  failed: '#bf3f2a',
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  failed: 'Failed',
};

export default function TransactionItem({record}: Props): React.JSX.Element {
  const date = new Date(record.date);
  const statusColor = STATUS_COLORS[record.status] ?? '#888';
  const statusLabel = STATUS_LABELS[record.status] ?? record.status;

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
          <Text style={styles.amount}>-{`$${record.amount.toFixed(2)}`}</Text>
          <Text style={[styles.status, {color: statusColor}]}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: tokens.radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  info: {flex: 1},
  recipient: {
    ...tokens.type.label,
    fontFamily: 'monospace',
    color: tokens.colors.textPrimary,
  },
  date: {
    ...tokens.type.caption,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  memo: {
    ...tokens.type.caption,
    color: tokens.colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  right: {alignItems: 'flex-end'},
  amount: {
    ...tokens.type.heading,
    color: tokens.colors.textPrimary,
  },
  status: {
    ...tokens.type.caption,
    fontWeight: '600',
    marginTop: 4,
  },
});
