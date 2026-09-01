import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {CompositeNavigationProp, useFocusEffect, useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {StackNavigationProp} from '@react-navigation/stack';

import {useBalance} from '../hooks/useBalance';
import {useWalletStore} from '../store/walletStore';
import {truncateAddress} from '../services/solana';
import {getGasstation} from '../services/gasstationAdapter';
import {formatUsd} from '../utils/format';
import {getHistoryPresentation} from '../utils/historyPresentation';


import {
  BalanceDisplay,
  Button,
  CircularAction,
  Icon,
  ListRow,
  Screen,
  ScreenHeader,
  SkeletonRows,
  useToast,
} from '../components/ui';
import {
  MainTabParamList,
  RootStackParamList,
  TransactionRecord,
} from '../types';
import {tokens} from '../theme/tokens';

/** Home sits in the tab navigator but also pushes onto the root stack. */
type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

type HomeScreenProps = {
  onLogout: () => Promise<void>;
};

const PREVIEW_COUNT = 4;

function emptyHistory(walletAddress = ''): TransactionRecord {
  return {
    data: [],
    page: 1,
    pageSize: PREVIEW_COUNT,
    limit: PREVIEW_COUNT,
    offset: 0,
    total: 0,
    status: 'success',
    id: '',
    walletAddress,
  };
}

export default function HomeScreen({onLogout}: HomeScreenProps): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const wallet = useWalletStore(s => s.wallet);
  const {showToast} = useToast();

  const {data: balance, isLoading, refetch} = useBalance();
  const [historyPreview, setHistoryPreview] =
    useState<TransactionRecord>(emptyHistory());
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const hasWallet =
    typeof wallet?.publicKey === 'string' && wallet.publicKey.length > 0;

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Log out and remove the account stored on this device?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await onLogout();
        },
      },
    ]);
  }, [onLogout]);

  const handleCopyAddress = useCallback(() => {
    if (!wallet?.publicKey) {
      return;
    }
    Clipboard.setString(wallet.publicKey);
    showToast('Payment address copied');
  }, [showToast, wallet?.publicKey]);

  const loadHistoryPreview = useCallback(async () => {
    if (!wallet?.publicKey) {
      setHistoryPreview(emptyHistory());
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    try {
      setHistoryError(null);
      const sdk = await getGasstation();
      const history = await sdk.getHistory({
        walletAddress: wallet.publicKey,
        page: 1,
        pageSize: PREVIEW_COUNT,
      });
      setHistoryPreview({
        ...history,
        data: history.data.slice(0, PREVIEW_COUNT),
      });
    } catch (error) {
      console.error('[HomeScreen] Failed to load history preview:', error);
      setHistoryError('Activity could not be loaded.');
      setHistoryPreview(emptyHistory(wallet.publicKey));
    } finally {
      setHistoryLoading(false);
    }
  }, [wallet?.publicKey]);

  useFocusEffect(
    useCallback(() => {
      loadHistoryPreview();
    }, [loadHistoryPreview]),
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), loadHistoryPreview()]);
  }, [loadHistoryPreview, refetch]);

  return (
    <Screen scroll edgeBottom={false} onRefresh={handleRefresh} refreshing={isLoading}>
      <ScreenHeader
        action={{
          label: 'Logout',
          onPress: handleLogout,
          accessibilityLabel: 'Log out of this device',
        }}
      />

      {!hasWallet ? (
        <View style={styles.noWallet}>
          <Text style={styles.noWalletTitle}>No account on this device</Text>
          <Text style={styles.noWalletBody}>
            Log out and set up again to start paying.
          </Text>
        </View>
      ) : (
        <>
          {/*
            The balance leads the screen. It previously sat inside a bordered
            card below a gradient hero whose headline was a truncated base58
            address - chrome outranking the value the screen exists to show.
          */}
          <BalanceDisplay
            label="Available balance"
            value={formatUsd(balance?.usdcBalance ?? 0)}
            meta={truncateAddress(wallet!.publicKey, 6)}
            loading={isLoading}
          />

          <View style={styles.actions}>
            <CircularAction
              icon="send"
              label="Pay"
              emphasis="primary"
              onPress={() => navigation.navigate('Send')}
              accessibilityHint="Enter an amount to send"
            />
            <CircularAction
              icon="copy"
              label="Copy"
              onPress={handleCopyAddress}
              accessibilityHint="Copies your payment address"
            />
            <CircularAction
              icon="scan"
              label="Scan"
              onPress={() => navigation.navigate('Scan')}
              accessibilityHint="Scan a payment code"
            />
            <CircularAction
              icon="clock"
              label="Activity"
              onPress={() => navigation.navigate('History')}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              {historyPreview.data.length > 0 ? (
                <Button
                  label="View all"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onPress={() => navigation.navigate('History')}
                  style={styles.viewAll}
                />
              ) : null}
            </View>

            {historyLoading ? (
              <SkeletonRows count={3} />
            ) : historyPreview.data.length === 0 ? (
              <View style={styles.empty}>
                <Icon
                  name={historyError ? 'alert' : 'clock'}
                  size={tokens.icon.lg}
                  color={historyError ? tokens.color.error : tokens.color.textMuted}
                />
                <Text style={styles.emptyText}>
                  {historyError ??
                    'No payments yet. Your latest activity will show here.'}
                </Text>
              </View>
            ) : (
              historyPreview.data.map((item, index) => {
                const presentation = getHistoryPresentation(item);
                return (
                  <ListRow
                    key={item.signature}
                    divided={index > 0}
                    leadingIcon={presentation.icon}
                    leadingTone={presentation.leadingTone}
                    title={presentation.title}
                    subtitle={presentation.date}
                    value={presentation.value}
                    onPress={() =>
                      navigation.navigate('Receipt', {receiptData: item})
                    }
                    accessibilityLabel={`${presentation.title}, ${presentation.date}`}
                    accessibilityHint="Opens the receipt"
                  />
                );
              })
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xxxl,
  },
  section: {
    marginTop: tokens.spacing.huge,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
    minHeight: tokens.layout.touchTarget,
  },
  sectionTitle: {
    ...tokens.type.heading,
    color: tokens.color.textPrimary,
  },
  viewAll: {
    paddingHorizontal: tokens.spacing.md,
    marginRight: -tokens.spacing.md,
  },
  empty: {
    alignItems: 'center',
    gap: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xxxl,
  },
  emptyText: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  noWallet: {
    alignItems: 'center',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.giant,
  },
  noWalletTitle: {
    ...tokens.type.title,
    color: tokens.color.textPrimary,
    textAlign: 'center',
  },
  noWalletBody: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
});
