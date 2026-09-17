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
import React, {useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, Share, Alert, Pressable} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useWalletStore} from '../store/walletStore';
import {truncateAddress} from '../services/solana';
import QRCodeMatrix from '../components/QRCodeMatrix';
import {Button, Screen, ScreenHeader, Surface, useToast} from '../components/ui';
import {stableCoinMint} from '../config/paymentConfig';
import {tokens} from '../theme/tokens';

export default function QRScreen(): React.JSX.Element {
  const wallet = useWalletStore(s => s.wallet);
  const {showToast} = useToast();

  const solanaPayUrl = useMemo(() => {
    if (!wallet) {return '';}
    return `solana:${wallet.publicKey}?spl-token=${stableCoinMint}`;
  }, [wallet]);

  const handleCopyAddress = useCallback(() => {
    if (!wallet?.publicKey) {
      return;
    }
    Clipboard.setString(wallet.publicKey);
    showToast('Payment address copied');
  }, [showToast, wallet?.publicKey]);

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

      <Pressable
        onPress={handleCopyAddress}
        accessibilityRole="button"
        accessibilityLabel={`Payment address: ${wallet.publicKey}`}
        accessibilityHint="Double tap to copy payment address">
        <Surface style={styles.accountPanel}>
          <Text style={styles.address}>{truncateAddress(wallet.publicKey, 8)}</Text>
          <Text style={styles.fullAddress} selectable>
            {wallet.publicKey}
          </Text>
        </Surface>
      </Pressable>

      <View style={styles.actionButtons}>
        <Button
          label="Copy address"
          icon="copy"
          variant="secondary"
          onPress={handleCopyAddress}
          style={styles.actionBtn}
        />
        <Button
          label="Share payment code"
          icon="share"
          onPress={handleShare}
          style={styles.actionBtn}
        />
      </View>

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
  actionButtons: {
    width: '100%',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xxl,
  },
  actionBtn: {
    width: '100%',
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
