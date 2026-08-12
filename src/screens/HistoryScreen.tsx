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
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {clearHistory, getHistory, updateHistoryRecord} from '../services/storage';
import {getTransactionStatus} from '../services/solana';
import {TransactionRecord, TransactionStatus} from '../types';
import TransactionItem from '../components/TransactionItem';
import {tokens} from '../theme/tokens';

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
        <ActivityIndicator color={tokens.colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="historyHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#3f8cff" />
              <Stop offset="55%" stopColor="#4f7ef4" />
              <Stop offset="100%" stopColor="#6d5ce8" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#historyHeroGradient)" />
        </Svg>

        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />

        <View style={styles.heroHeaderRow}>
          <View>
            <Text style={styles.kicker}>ACTIVITY</Text>
            <Text style={styles.title}>Recent Payments</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtnWrap}>
              <Text style={styles.clearBtn}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.subtitle}>Your recent payment activity on this device.</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyBadge}>
            <Text style={styles.emptyBadgeText}>PAY</Text>
          </View>
          <Text style={styles.emptyText}>No activity yet</Text>
          <Text style={styles.emptySubtext}>
            Your confirmed and pending payments will appear here.
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
    backgroundColor: tokens.colors.page,
    paddingTop: 26,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.page,
  },
  hero: {
    minHeight: 174,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowTop: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    top: -54,
    right: -34,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  heroGlowBottom: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 999,
    bottom: -40,
    left: -18,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  kicker: {
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 1,
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  clearBtnWrap: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  clearBtn: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 32,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  emptyBadge: {
    borderWidth: 1,
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.accentSoft,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: tokens.radius.pill,
    marginBottom: 16,
  },
  emptyBadgeText: {
    color: tokens.colors.accentDark,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emptyText: {
    color: tokens.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});
