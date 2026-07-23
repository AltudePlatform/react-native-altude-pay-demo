import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Clipboard, Alert} from 'react-native';
import {truncateAddress} from '../services/solana';

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
      <Text style={styles.address}>{truncateAddress(address, 8)}</Text>
      <Text style={styles.copyHint}>tap to copy</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e30',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14F195',
  },
  address: {
    color: '#ccc',
    fontSize: 13,
    fontFamily: 'monospace',
    flex: 1,
  },
  copyHint: {
    color: '#555',
    fontSize: 11,
  },
});
