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
import {View, Text, StyleSheet, Share, Alert} from 'react-native';
import {useWalletStore} from '../store/walletStore';
import {truncateAddress} from '../services/solana';
import QRCodeMatrix from '../components/QRCodeMatrix';
import {Button, Screen, ScreenHeader, Surface} from '../components/ui';
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
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader eyebrow="Receive" title="Get paid" />
      <Text style={styles.subtitle}>
        Share this code so people can send you money.
      </Text>

      {/* QR modules stay black-on-white regardless of theme so scanners can
          read them; this surface is intentionally exempt from the dark sweep. */}
      <View style={styles.qrCard}>
        <QRCodeMatrix value={solanaPayUrl} size={232} />
      </View>

      <Surface style={styles.accountPanel}>
        <Text style={styles.address}>{truncateAddress(wallet.publicKey, 8)}</Text>
        <Text style={styles.fullAddress} selectable>
          {wallet.publicKey}
        </Text>
      </Surface>

      <Button
        label="Share payment code"
        icon="share"
        onPress={handleShare}
        style={styles.shareBtn}
      />

      <Text style={styles.urlLabel}>PAYMENT LINK</Text>
      <Text style={styles.url} selectable>
        {solanaPayUrl}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.color.canvas,
  },
  noWallet: {
    ...tokens.type.title,
    color: tokens.color.textPrimary,
  },
  noWalletSub: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
  },
  subtitle: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: tokens.spacing.xxl,
  },
  qrCard: {
    backgroundColor: tokens.color.qr.background,
    padding: tokens.spacing.xl,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.xl,
  },
  accountPanel: {
    width: '100%',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.lg,
  },
  address: {
    ...tokens.type.monoValue,
    color: tokens.color.textPrimary,
    textAlign: 'center',
  },
  fullAddress: {
    ...tokens.type.mono,
    color: tokens.color.textMuted,
    textAlign: 'center',
  },
  shareBtn: {
    marginBottom: tokens.spacing.xxl,
  },
  urlLabel: {
    ...tokens.type.eyebrow,
    color: tokens.color.textMuted,
    marginBottom: tokens.spacing.md,
    alignSelf: 'flex-start',
  },
  url: {
    ...tokens.type.mono,
    color: tokens.color.textPrimary,
    alignSelf: 'stretch',
    backgroundColor: tokens.color.surface,
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.borderHairline,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.lg,
    lineHeight: 20,
  },
});
