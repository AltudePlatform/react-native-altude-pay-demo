import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import {getAccountPaymentHistory} from '../services/altudeHistory';
import {truncateAddress} from '../services/solana';
import {useWalletStore} from '../store/walletStore';
import {formatRelativeDate} from '../utils/format';
import {
  Button,
  Icon,
  ListRow,
  Screen,
  ScreenHeader,
  SkeletonRows,
} from '../components/ui';
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
    ({item, index}: {item: AltudeHistoryEntry; index: number}) => (
      <ListRow
        divided={index > 0}
        leadingIcon="arrowUpRight"
        leadingTone={item.error ? 'error' : 'success'}
        title="Payment"
        subtitle={formatRelativeDate(item.createdAt)}
        value={truncateAddress(item.signature, 4)}
        onPress={() => navigation.navigate('Receipt', {signature: item.signature})}
        accessibilityLabel={`Payment, ${formatRelativeDate(item.createdAt)}`}
        accessibilityHint="Opens the receipt"
      />
    ),
    [navigation],
  );

  /*
    The header stays mounted while loading. Previously a full-screen spinner
    replaced the entire body, so the layout jumped once data arrived.
  */
  const header = (
    <ScreenHeader
      onBack={() => navigation.goBack()}
      eyebrow="Activity"
      title="Recent payments"
    />
  );

  if (loading) {
    return (
      <Screen>
        {header}
        <SkeletonRows count={5} />
      </Screen>
    );
  }

  if (entries.length === 0) {
    return (
      <Screen>
        {header}
        <View style={styles.empty}>
          <Icon
            name={error ? 'alert' : 'clock'}
            size={32}
            color={error ? tokens.color.error : tokens.color.textMuted}
          />
          <Text style={styles.emptyTitle}>
            {error ? 'Activity unavailable' : 'No activity yet'}
          </Text>
          <Text style={styles.emptyBody}>
            {error ?? 'Your payments will appear here once you send one.'}
          </Text>
          <Button
            label="Refresh"
            icon="refresh"
            variant="secondary"
            fullWidth={false}
            onPress={loadHistory}
            style={styles.retry}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={entries}
        keyExtractor={item => item.signature}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadHistory}
            tintColor={tokens.color.brand}
            colors={[tokens.color.brand]}
            progressBackgroundColor={tokens.color.surface}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: tokens.spacing.xxxl,
  },
  empty: {
    alignItems: 'center',
    gap: tokens.spacing.lg,
    paddingTop: tokens.spacing.giant,
  },
  emptyTitle: {
    ...tokens.type.title,
    color: tokens.color.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  retry: {
    marginTop: tokens.spacing.md,
  },
});
