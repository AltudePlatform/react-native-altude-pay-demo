/**
 * QR Code Screen – displays the user's Solana Pay QR code.
 *
 * The QR encodes a Solana Pay URL:
 *   solana:<recipient>?spl-token=<USDC_MINT>
 *
 * Uses react-native-svg to render a simple QR grid instead of an
 * additional QR library, keeping the dependency count low.
 * For production quality, swap in react-native-qrcode-svg.
 */
import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ScrollView,
} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useWalletStore} from '../store/walletStore';
import {truncateAddress} from '../services/solana';
import QRCodeMatrix from '../components/QRCodeMatrix';
import {stableCoinMint} from '../config/paymentConfig';
import {tokens} from '../theme/tokens';

export default function QRScreen(): React.JSX.Element {
  const wallet = useWalletStore(s => s.wallet);

  const solanaPayUrl = useMemo(() => {
    if (!wallet) {return '';}
    return `solana:${wallet.publicKey}?spl-token=${stableCoinMint}`;
  }, [wallet]);

  const handleShare = async () => {
    if (!wallet) {return;}
    try {
      await Share.share({
        message: solanaPayUrl,
        title: 'My payment code',
      });
    } catch {
      Alert.alert('Error', 'Could not share QR code.');
    }
  };

  if (!wallet) {
    return (
      <View style={styles.center}>
        <Text style={styles.noWallet}>No account connected yet.</Text>
        <Text style={styles.noWalletSub}>Go to Home to create an account.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="qrHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#3f8cff" />
              <Stop offset="55%" stopColor="#4f7ef4" />
              <Stop offset="100%" stopColor="#6d5ce8" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#qrHeroGradient)" />
        </Svg>

        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />

        <Text style={styles.kicker}>RECEIVE</Text>
        <Text style={styles.title}>Get paid</Text>
        <Text style={styles.subtitle}>Share this code so people can send you money.</Text>
      </View>

      <View style={styles.qrCard}>
        <QRCodeMatrix value={solanaPayUrl} size={232} />
      </View>

      <View style={styles.accountPanel}>
        <Text style={styles.address}>{truncateAddress(wallet.publicKey, 8)}</Text>
        <Text style={styles.fullAddress} selectable>
          {wallet.publicKey}
        </Text>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>Share Payment Code</Text>
      </TouchableOpacity>

      <Text style={styles.urlLabel}>Payment Link</Text>
      <Text style={styles.url} selectable>
        {solanaPayUrl}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.page,
  },
  content: {
    alignItems: 'center',
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  hero: {
    width: '100%',
    minHeight: 170,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  heroGlowTop: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    top: -56,
    right: -34,
    backgroundColor: 'rgba(255,255,255,0.22)',
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.page,
  },
  noWallet: {
    color: tokens.colors.textPrimary,
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '700',
  },
  noWalletSub: {
    color: tokens.colors.textMuted,
    fontSize: 14,
  },
  kicker: {
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 1,
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 7,
  },
  title: {
    fontSize: 31,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginBottom: 0,
  },
  qrCard: {
    backgroundColor: tokens.colors.card,
    padding: 18,
    borderRadius: tokens.radius.lg,
    marginBottom: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  accountPanel: {
    width: '100%',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  address: {
    color: tokens.colors.textPrimary,
    fontSize: 15,
    fontFamily: 'monospace',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '700',
  },
  fullAddress: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  shareBtn: {
    width: '100%',
    backgroundColor: tokens.colors.accent,
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  urlLabel: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
    alignSelf: 'flex-start',
    fontWeight: '700',
  },
  url: {
    color: tokens.colors.textPrimary,
    fontSize: 11,
    fontFamily: 'monospace',
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
});
