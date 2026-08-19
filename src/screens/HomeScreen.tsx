import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

import {useBalance} from '../hooks/useBalance';
import {getAccountPaymentHistory, transactionTypeLabel} from '../services/altudeHistory';
import {useWalletStore} from '../store/walletStore';
import {truncateAddress} from '../services/solana';
import BalanceCard from '../components/BalanceCard';
import {AltudeHistoryEntry, RootStackParamList} from '../types';
import {tokens} from '../theme/tokens';

type NavProp = StackNavigationProp<RootStackParamList>;

type HomeScreenProps = {
  onLogout: () => Promise<void>;
};

export default function HomeScreen({onLogout}: HomeScreenProps): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const wallet = useWalletStore(s => s.wallet);

  const {data: balance, isLoading, refetch} = useBalance();
  const [historyPreview, setHistoryPreview] = useState<AltudeHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const hasWallet = typeof wallet?.publicKey === 'string' && wallet.publicKey.length > 0;

  React.useEffect(() => {
    console.log('[screen] HomeScreen mounted');
  }, []);

  const displayAddress = hasWallet ? truncateAddress(wallet!.publicKey, 6) : 'No account';

  const handleDisconnectWallet = useCallback(() => {
    Alert.alert(
      'Logout',
      'Log out and remove the account stored on this device?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await onLogout();
          },
        },
      ],
    );
  }, [onLogout]);

  const handleOpenHistory = useCallback(() => {
    navigation.navigate('History');
  }, [navigation]);

  const loadHistoryPreview = useCallback(async () => {
    if (!wallet?.publicKey) {
      setHistoryPreview([]);
      return;
    }

    try {
      setHistoryError(null);
      const history = await getAccountPaymentHistory(wallet.publicKey, 5,1);
      console.log('[HomeScreen] Loaded history preview:', history);
      setHistoryPreview(history);
    } catch (error) {
      console.error('[HomeScreen] Failed to load history preview:', error);
      setHistoryError('Activity could not be loaded.');
      setHistoryPreview([]);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={tokens.colors.accent}
        />
      }>
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill} width="110%" height="110%">
          <Defs>
            <LinearGradient id="homeHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#3f8cff" />
              <Stop offset="55%" stopColor="#4f7ef4" />
              <Stop offset="100%" stopColor="#6d5ce8" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#homeHeroGradient)" />
        </Svg>

        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />

        {hasWallet ? (
          <TouchableOpacity
            onPress={handleDisconnectWallet}
            style={styles.heroTopAction}>
            <Text style={styles.heroSecondaryActionText}>Logout</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.heroHeaderRow}>
          <Text style={styles.kicker}>WELCOME BACK</Text>
        </View>

        <Text style={styles.heroTitle}>{displayAddress}</Text>
        <Text style={styles.heroSubtitle}>Manage payments and monitor account activity from one place.</Text>
      </View>

      {!hasWallet && (
        <View style={styles.noWallet}>
          <Text style={styles.noWalletText}>No account on this device</Text>
          <Text style={styles.noWalletSubtext}>
            Log out and set up again to start paying.
          </Text>
        </View>
      )}

      {hasWallet && (
        <>
          <BalanceCard
            walletAddress={wallet!.publicKey}
            usdcBalance={balance?.usdcBalance ?? 0}
            isLoading={isLoading}
          />

          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={handleOpenHistory}>
                <Text style={styles.historyViewAll}>View all</Text>
              </TouchableOpacity>
            </View>

            {historyPreview.length === 0 ? (
              <Text style={styles.historyEmpty}>
                {historyError ?? 'No payments yet. Your latest activity will show here.'}
              </Text>
            ) : (
              historyPreview.map(item => (
                <TouchableOpacity
                  style={styles.historyRow}
                  key={item.signature}
                  onPress={() =>
                    navigation.navigate('Receipt', {signature: item.signature})
                  }>
                  <View style={styles.historyRowLeft}>
                    <Text style={styles.historyPerson}>
                      {transactionTypeLabel(item.transactionType)}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {truncateAddress(item.signature, 8)}
                    </Text>
                  </View>
                  <View style={styles.historyRowRight}>
                    <Text style={styles.historyStatus}>Receipt</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.page,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
  },
  hero: {
    minHeight: 204,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowTop: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    top: -66,
    right: -30,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  heroGlowBottom: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    bottom: -48,
    left: -26,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  kicker: {
    ...tokens.type.eyebrow,
    color: tokens.onAccent.secondary,
    flexShrink: 1,
  },
  heroTitle: {
    ...tokens.type.title,
    fontSize: 28,
    lineHeight: 34,
    color: tokens.onAccent.primary,
  },
  heroSubtitle: {
    ...tokens.type.body,
    color: tokens.onAccent.secondary,
    marginTop: 10,
    maxWidth: '90%',
  },
  heroTopAction: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 2,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroSecondaryActionText: {
    ...tokens.type.caption,
    fontWeight: '700',
    color: tokens.onAccent.primary,
    textAlign: 'center',
  },
  historyCard: {
    marginTop: 14,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyTitle: {
    ...tokens.type.heading,
    color: tokens.colors.textPrimary,
  },
  historyViewAll: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.colors.accent,
  },
  historyEmpty: {
    ...tokens.type.label,
    fontWeight: '500',
    color: tokens.colors.textMuted,
    paddingVertical: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: 10,
    paddingBottom: 8,
  },
  historyRowLeft: {
    flex: 1,
    paddingRight: 10,
  },
  historyPerson: {
    ...tokens.type.label,
    color: tokens.colors.textPrimary,
  },
  historyMeta: {
    ...tokens.type.mono,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  historyRowRight: {
    alignItems: 'flex-end',
  },
  historyStatus: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.colors.accent,
  },
  noWallet: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 14,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 16,
  },
  noWalletText: {
    ...tokens.type.title,
    fontSize: 20,
    lineHeight: 26,
    color: tokens.colors.textPrimary,
  },
  noWalletSubtext: {
    ...tokens.type.body,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
});
