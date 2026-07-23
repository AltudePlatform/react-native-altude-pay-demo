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
} from 'react-native';
import Svg, {Rect} from 'react-native-svg';
import {useWalletStore} from '../store/walletStore';
import {truncateAddress} from '../services/solana';
import QRCodeMatrix from '../components/QRCodeMatrix';

const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

export default function QRScreen(): React.JSX.Element {
  const wallet = useWalletStore(s => s.wallet);

  const solanaPayUrl = useMemo(() => {
    if (!wallet) return '';
    return `solana:${wallet.publicKey}?spl-token=${USDC_DEVNET_MINT}`;
  }, [wallet]);

  const handleShare = async () => {
    if (!wallet) return;
    try {
      await Share.share({
        message: solanaPayUrl,
        title: 'My AltudePay QR Code',
      });
    } catch {
      Alert.alert('Error', 'Could not share QR code.');
    }
  };

  if (!wallet) {
    return (
      <View style={styles.center}>
        <Text style={styles.noWallet}>No wallet connected.</Text>
        <Text style={styles.noWalletSub}>Go to Home to generate a wallet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My QR Code</Text>
      <Text style={styles.subtitle}>Scan to send me USDC</Text>

      <View style={styles.qrCard}>
        <QRCodeMatrix value={solanaPayUrl} size={240} />
      </View>

      <Text style={styles.address}>{truncateAddress(wallet.publicKey, 8)}</Text>
      <Text style={styles.fullAddress} selectable>
        {wallet.publicKey}
      </Text>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>Share QR Code</Text>
      </TouchableOpacity>

      <Text style={styles.urlLabel}>Solana Pay URL</Text>
      <Text style={styles.url} selectable numberOfLines={2}>
        {solanaPayUrl}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d1a',
  },
  noWallet: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
  },
  noWalletSub: {
    color: '#666',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9945FF',
    fontSize: 13,
    marginBottom: 28,
  },
  qrCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#9945FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  address: {
    color: '#ccc',
    fontSize: 15,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  fullAddress: {
    color: '#555',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  shareBtn: {
    backgroundColor: '#9945FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 28,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  urlLabel: {
    color: '#666',
    fontSize: 11,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  url: {
    color: '#444',
    fontSize: 11,
    fontFamily: 'monospace',
    alignSelf: 'flex-start',
  },
});
