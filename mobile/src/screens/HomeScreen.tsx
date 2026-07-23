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
import {useWalletStore} from '../store/walletStore';
import {generateDemoWallet} from '../services/solana';
import BalanceCard from '../components/BalanceCard';
import WalletAddress from '../components/WalletAddress';
import {MainTabParamList} from '../types';

type NavProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const wallet = useWalletStore(s => s.wallet);
  const setWallet = useWalletStore(s => s.setWallet);
  const removeWallet = useWalletStore(s => s.removeWallet);

  const {data: balance, isLoading, refetch} = useBalance();

  const handleGenerateWallet = useCallback(async () => {
    Alert.alert(
      wallet ? 'Replace Wallet' : 'Generate Demo Wallet',
      wallet
        ? 'This replaces the locally stored demo wallet. Back up your private key first.'
        : 'Generate a local demo wallet. Private keys stay on this device.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: wallet ? 'Replace' : 'Generate',
          style: wallet ? 'destructive' : 'default',
          onPress: async () => {
            const newWallet = generateDemoWallet();
            await setWallet(newWallet);
          },
        },
      ],
    );
  }, [setWallet, wallet]);

  const handleDisconnectWallet = useCallback(() => {
    Alert.alert(
      'Disconnect Wallet',
      'Remove the locally stored wallet from this device?',
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
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>AltudePay</Text>
          <Text style={styles.subtitle}>Client-first Solana USDC demo</Text>
          <Text style={styles.helperText}>
            Balances and confirmations come directly from Solana Devnet.
          </Text>
        </View>
        {wallet ? (
          <TouchableOpacity
            onPress={handleDisconnectWallet}
            style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Disconnect</Text>
          </TouchableOpacity>
        ) : null}
      </View>

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
            <TouchableOpacity
              style={[styles.actionBtn, styles.ghostBtn]}
              onPress={handleGenerateWallet}>
              <Text style={styles.ghostBtnText}>Generate New Wallet</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.noWallet}>
          <Text style={styles.noWalletText}>No wallet connected</Text>
          <Text style={styles.noWalletSubtext}>
            Create a local demo wallet to start using the app.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={handleGenerateWallet}>
            <Text style={styles.actionBtnText}>Generate Demo Wallet</Text>
          </TouchableOpacity>
        </View>
      )}

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
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9945FF',
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  secondaryAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a55',
  },
  secondaryActionText: {
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
  ghostBtn: {
    borderWidth: 1,
    borderColor: '#3a3a55',
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
  ghostBtnText: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 15,
  },
  noWallet: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 14,
  },
  noWalletText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  noWalletSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
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
