/**
 * QRCodeMatrix renders a Solana Pay QR code using react-native-qrcode-svg.
 *
 * If react-native-qrcode-svg is not installed, swap this component with
 * any QR rendering library – the parent passes a standard `value` prop.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import {tokens} from '../theme/tokens';

interface Props {
  value: string;
  size?: number;
}

export default function QRCodeMatrix({
  value,
  size = 200,
}: Props): React.JSX.Element {
  if (!value) {
    return (
      <View style={[styles.placeholder, {width: size, height: size}]}>
        <Text style={styles.placeholderText}>No QR data</Text>
      </View>
    );
  }

  return (
    <QRCode
      value={value}
      size={size}
      color={tokens.color.qr.module}
      backgroundColor={tokens.color.qr.background}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
  },
  placeholderText: {
    ...tokens.type.body,
    color: tokens.color.textMuted,
  },
});
