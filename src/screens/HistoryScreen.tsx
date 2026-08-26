import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
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
import {GetHistorySummary, RootStackParamList, TransactionRecord} from '../types';
import {tokens} from '../theme/tokens';
import {getGasstation} from '../services/gasstationAdapter';

type NavProp = StackNavigationProp<RootStackParamList>;

export default function HistoryScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const wallet = useWalletStore(s => s.wallet);
  const account = wallet?.publicKey;

  const [entries, setEntries] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!account) {
      setEntries(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sdk = await getGasstation();
      const history = await sdk.getHistory({
        walletAddress: wallet.publicKey,
        page: 1,
        pageSize: 20,
      });
      setEntries(history);
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
    ({item, index}: {item: GetHistorySummary; index: number}) => (
      <ListRow
        divided={index > 0}
        leadingIcon={item.type == "receive" ? "arrowDownLeft" : "arrowUpRight"}
        leadingTone={item.status === 'failed' ? 'error' : 'success'}
        title={item.type == "receive" ? "Incoming payment" : "Payment"}
        subtitle={formatRelativeDate(new Date((item.blockTime ?? 0) * 1000).toString())}
        value={
          (item.type == "receive" ? '+$' : '-$') +
          item.amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
          })
        }
        onPress={() => navigation.navigate('Receipt', {receiptData: item})}
        accessibilityLabel={`Payment, ${formatRelativeDate(new Date((item.blockTime ?? 0) * 1000).toString())}`}
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

  if (!entries) {
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
        data={entries.data}
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
