import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';

import {useBalance} from '../hooks/useBalance';
import {useAuthStore} from '../store/authStore';
import {useWalletStore} from '../store/walletStore';
import {generateDemoWallet} from '../services/solana';
import {truncateAddress} from '../services/solana';
import BalanceCard from '../components/BalanceCard';
import WalletAddress from '../components/WalletAddress';
import {MainTabParamList} from '../types';

type NavProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const username = useAuthStore(s => s.username);
  const logout = useAuthStore(s => s.logout);
  const wallet = useWalletStore(s => s.wallet);
  const setWallet = useWalletStore(s => s.setWallet);

  const {data: balance, isLoading, refetch} = useBalance();

  const handleGenerateWallet = useCallback(async () => {
    Alert.alert(
      'Generate New Wallet',
      'This will replace your current wallet. Make sure you have backed up your private key.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Generate',
          style: 'destructive',
          onPress: async () => {
            const newWallet = generateDemoWallet();
            await setWallet(newWallet);
          },
        },
      ],
    );
  }, [setWallet]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log Out', style: 'destructive', onPress: logout},
    ]);
  }, [logout]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#9945FF"
        />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{username}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet section */}
      {wallet ? (
        <>
          <WalletAddress address={wallet.publicKey} />

          <BalanceCard
            solBalance={balance?.solBalance ?? 0}
            usdcBalance={balance?.usdcBalance ?? 0}
            isLoading={isLoading}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={() => navigation.navigate('Send')}>
              <Text style={styles.actionBtnText}>Send USDC</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={() => navigation.navigate('QR')}>
              <Text style={styles.actionBtnTextSecondary}>My QR Code</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.noWallet}>
          <Text style={styles.noWalletText}>No wallet connected</Text>
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={handleGenerateWallet}>
            <Text style={styles.actionBtnText}>Generate Demo Wallet</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Devnet badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>DEVNET</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  greeting: {
    color: '#888',
    fontSize: 14,
  },
  username: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a55',
  },
  logoutText: {
    color: '#888',
    fontSize: 13,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#9945FF',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#9945FF',
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  actionBtnTextSecondary: {
    color: '#9945FF',
    fontWeight: '700',
    fontSize: 16,
  },
  noWallet: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 20,
  },
  noWalletText: {
    color: '#888',
    fontSize: 16,
  },
  badge: {
    marginTop: 40,
    alignSelf: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#14F195',
  },
  badgeText: {
    color: '#14F195',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
