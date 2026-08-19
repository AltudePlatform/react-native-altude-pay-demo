import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

import {getAccountPaymentHistory, transactionTypeLabel} from '../services/altudeHistory';
import {truncateAddress} from '../services/solana';
import {useWalletStore} from '../store/walletStore';
import {AltudeHistoryEntry, RootStackParamList} from '../types';
import {tokens} from '../theme/tokens';

type NavProp = StackNavigationProp<RootStackParamList>;

export default function HistoryScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const wallet = useWalletStore(s => s.wallet);
  const account = wallet?.publicKey;

  const [entries, setEntries] = useState<AltudeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!account) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setEntries(await getAccountPaymentHistory(account));
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Activity could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const renderItem = useCallback(
    ({item}: {item: AltudeHistoryEntry}) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('Receipt', {signature: item.signature})}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowType}>{transactionTypeLabel(item.transactionType)}</Text>
          <Text style={styles.rowSignature}>{truncateAddress(item.signature, 8)}</Text>
        </View>
        <Text style={styles.rowAction}>Solscan</Text>
      </TouchableOpacity>
    ),
    [navigation],
  );

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
        <Svg style={StyleSheet.absoluteFill} width="110%" height="110%">
          <Defs>
            <LinearGradient id="historyHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={tokens.gradient.heroFrom} />
              <Stop offset="55%" stopColor={tokens.gradient.heroMid} />
              <Stop offset="100%" stopColor={tokens.gradient.heroTo} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#historyHeroGradient)" />
        </Svg>

        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />

        <Text style={styles.kicker}>ACTIVITY</Text>
        <Text style={styles.title}>Recent Payments</Text>
        <Text style={styles.subtitle}>Tap a payment to see its details on Solscan.</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyBadge}>
            <Text style={styles.emptyBadgeText}>PAY</Text>
          </View>
          <Text style={styles.emptyText}>
            {error ? 'Activity unavailable' : 'No activity yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {error ?? 'Your payments will appear here once you send one.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadHistory}>
            <Text style={styles.retryBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.signature}
          renderItem={renderItem}
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
    justifyContent: 'center',
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
  kicker: {
    ...tokens.type.eyebrow,
    color: tokens.onAccent.secondary,
    marginBottom: 6,
  },
  title: {
    ...tokens.type.display,
    color: tokens.onAccent.primary,
  },
  subtitle: {
    ...tokens.type.body,
    color: tokens.onAccent.secondary,
    marginTop: 10,
  },
  list: {
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    padding: 16,
    marginBottom: 12,
    gap: tokens.spacing.sm,
  },
  rowLeft: {
    gap: 4,
    flexShrink: 1,
  },
  rowType: {
    ...tokens.type.heading,
    color: tokens.colors.textPrimary,
  },
  rowSignature: {
    ...tokens.type.mono,
    color: tokens.colors.textMuted,
  },
  rowAction: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.colors.accent,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyBadge: {
    backgroundColor: tokens.colors.accentSoft,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: tokens.radius.pill,
    marginBottom: 16,
  },
  emptyBadgeText: {
    ...tokens.type.eyebrow,
    color: tokens.colors.accentDark,
  },
  emptyText: {
    ...tokens.type.title,
    fontSize: 20,
    lineHeight: 26,
    color: tokens.colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    ...tokens.type.body,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: tokens.spacing.lg,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.card,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    ...tokens.type.body,
    fontWeight: '700',
    color: tokens.colors.accent,
  },
});
