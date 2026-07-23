import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {clearHistory, getHistory, updateHistoryRecord} from '../services/storage';
import {getTransactionStatus} from '../services/solana';
import {TransactionRecord, TransactionStatus} from '../types';
import TransactionItem from '../components/TransactionItem';

export default function HistoryScreen(): React.JSX.Element {
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPendingRecords = useCallback(
    async (records: TransactionRecord[]): Promise<TransactionRecord[]> => {
      const updatedRecords = await Promise.all(
        records.map(async record => {
          if (record.status !== 'pending') {
            return record;
          }

          const status = await getTransactionStatus(record.signature);
          const nextStatus: TransactionStatus =
            status.status === 'failed'
              ? 'failed'
              : status.confirmed
                ? 'confirmed'
                : 'pending';

          if (nextStatus !== record.status) {
            await updateHistoryRecord(record.id, {status: nextStatus});
            return {...record, status: nextStatus};
          }

          return record;
        }),
      );

      return updatedRecords;
    },
    [],
  );

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const records = await getHistory();
      const refreshed = await refreshPendingRecords(records);
      setHistory(refreshed);
    } finally {
      setLoading(false);
    }
  }, [refreshPendingRecords]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all locally stored transaction history?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setHistory([]);
          },
        },
      ],
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#9945FF" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>
            Confirmed and pending payments stored on this device appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={({item}) => <TransactionItem record={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={loadHistory}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  clearBtn: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
