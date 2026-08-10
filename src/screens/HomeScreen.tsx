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
import {getHistory} from '../services/storage';
import {useWalletStore} from '../store/walletStore';
import {generateDemoWallet, truncateAddress} from '../services/solana';
import BalanceCard from '../components/BalanceCard';
import {RootStackParamList, TransactionRecord} from '../types';
import {tokens} from '../theme/tokens';
import { topupWallet } from '../services/faucet';

type NavProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const wallet = useWalletStore(s => s.wallet);
  const setWallet = useWalletStore(s => s.setWallet);
  const removeWallet = useWalletStore(s => s.removeWallet);

  const {data: balance, isLoading, refetch} = useBalance();
  const [historyPreview, setHistoryPreview] = useState<TransactionRecord[]>([]);

  const hasWallet = typeof wallet?.publicKey === 'string' && wallet.publicKey.length > 0;

  React.useEffect(() => {
    console.log('[screen] HomeScreen mounted');
  }, []);

  const displayAddress = hasWallet ? truncateAddress(wallet!.publicKey, 6) : 'No account';

  const handleGenerateWallet = useCallback(async () => {
    Alert.alert(
      hasWallet ? 'Replace Account' : 'Create Account',
      hasWallet
        ? 'This will replace the account currently stored on this device. Make sure your access details are backed up.'
        : 'Create a new payment account on this device. Your account details stay local.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: hasWallet ? 'Replace' : 'Generate',
          style: hasWallet ? 'destructive' : 'default',
          onPress: async () => {
            const newWallet = await generateDemoWallet();
            await setWallet(newWallet);
            await topupWallet(newWallet.publicKey);
          },
        },
      ],
    );
  }, [hasWallet, setWallet]);

  const handleDisconnectWallet = useCallback(() => {
    Alert.alert(
      'Disconnect Account',
      'Remove the account stored on this device?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await removeWallet();
          },
        },
      ],
    );
  }, [removeWallet]);

  // Auto-generate a wallet on first visit if none exists (no user prompt).
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (hasWallet) return;

      try {
        const newWallet = await generateDemoWallet();
        if (cancelled) return;
        await setWallet(newWallet);
        // Try to top up for demo convenience; ignore failures.
        topupWallet(newWallet.publicKey).catch(() => {});
      } catch {
        // Ignore generation failures here; user can still press Create Account.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasWallet, setWallet]);

  const handleOpenHistory = useCallback(() => {
    navigation.navigate('History');
  }, [navigation]);

  const loadHistoryPreview = useCallback(async () => {
    if (!hasWallet) {
      setHistoryPreview([]);
      return;
    }

    const history = await getHistory();
    setHistoryPreview(history.slice(0, 5));
  }, [hasWallet]);

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
            <Text style={styles.heroSecondaryActionText}>Disconnect</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.heroHeaderRow}>
          <Text style={styles.kicker}>WELCOME BACK</Text>
        </View>

        <Text style={styles.heroTitle}>{displayAddress}</Text>
        <Text style={styles.heroSubtitle}>Manage payments and monitor account activity from one place.</Text>
      </View>

      {hasWallet && (
        <>
          <BalanceCard
            walletAddress={wallet!.publicKey}
            solBalance={balance?.solBalance ?? 0}
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
              <Text style={styles.historyEmpty}>No payments yet. Your latest activity will show here.</Text>
            ) : (
              historyPreview.map(item => (
                <View style={styles.historyRow} key={item.id}>
                  <View style={styles.historyRowLeft}>
                    <Text style={styles.historyPerson}>{truncateAddress(item.recipient, 6)}</Text>
                    <Text style={styles.historyMeta}>{new Date(item.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.historyRowRight}>
                    <Text style={styles.historyAmount}>-{`$${item.amount.toFixed(2)}`}</Text>
                    <Text style={styles.historyStatus}>{item.status}</Text>
                  </View>
                </View>
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
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 11,
    flexShrink: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 10,
    maxWidth: '90%',
    lineHeight: 20,
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
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
    color: tokens.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  historyViewAll: {
    color: tokens.colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  historyEmpty: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
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
    color: tokens.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  historyMeta: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  historyRowRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    color: tokens.colors.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
  historyStatus: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  actionBtn: {
    borderRadius: tokens.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: tokens.colors.accent,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: tokens.colors.accent,
    backgroundColor: '#fff',
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.card,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  actionBtnTextSecondary: {
    color: tokens.colors.accent,
    fontWeight: '800',
    fontSize: 16,
  },
  ghostBtnText: {
    color: tokens.colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
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
    color: tokens.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  noWalletSubtext: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
