import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Clipboard, Alert} from 'react-native';
import {truncateAddress} from '../services/solana';
import {tokens} from '../theme/tokens';

interface Props {
  address: string;
}

export default function WalletAddress({address}: Props): React.JSX.Element {
  const handleCopy = () => {
    Clipboard.setString(address);
    Alert.alert('Copied', 'Wallet address copied to clipboard.');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleCopy}>
      <View style={styles.dot} />
      <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
        {truncateAddress(address, 6)}
      </Text>
      <Text style={styles.copyHint}>Copy</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.success,
  },
  address: {
    color: tokens.colors.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
    flex: 1,
  },
  copyHint: {
    color: tokens.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 0,
  },
});
