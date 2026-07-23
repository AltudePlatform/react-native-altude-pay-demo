/**
 * QRCodeMatrix renders a Solana Pay QR code using react-native-qrcode-svg.
 *
 * If react-native-qrcode-svg is not installed, swap this component with
 * any QR rendering library – the parent passes a standard `value` prop.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

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
      color="#000"
      backgroundColor="#fff"
      // Solana logo overlay can be added via logo prop
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
});
