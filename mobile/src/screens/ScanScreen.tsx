/**
 * Scan Screen – uses react-native-vision-camera to scan a Solana Pay QR code.
 *
 * Parses the scanned URL and pre-fills the Send screen with:
 *  - recipient address
 *  - optional amount
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '../types';

type NavProp = BottomTabNavigationProp<MainTabParamList, 'QR'>;

function parseSolanaPayUrl(url: string): {
  recipient?: string;
  amount?: string;
} | null {
  // Solana Pay: solana:<address>?amount=<n>&...
  const match = url.match(/^solana:([1-9A-HJ-NP-Za-km-z]{32,44})(.*)?$/);
  if (!match) return null;

  const recipient = match[1];
  const params = new URLSearchParams(match[2]?.slice(1) ?? '');
  const amount = params.get('amount') ?? undefined;

  return {recipient, amount};
}

export default function ScanScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);

  const device = useCameraDevice('back');

  useEffect(() => {
    Camera.requestCameraPermission().then(status =>
      setHasPermission(status === 'granted'),
    );
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (scanned) return;
      const first = codes[0]?.value;
      if (!first) return;

      setScanned(true);
      const parsed = parseSolanaPayUrl(first);
      if (parsed?.recipient) {
        navigation.navigate('Send', {
          recipient: parsed.recipient,
          amount: parsed.amount,
        });
      } else {
        Alert.alert('Invalid QR', 'This QR code is not a valid Solana Pay URL.', [
          {text: 'OK', onPress: () => setScanned(false)},
        ]);
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera permission required</Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={() => Camera.requestCameraPermission()}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!scanned}
        codeScanner={codeScanner}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.instruction}>Point at a Solana Pay QR code</Text>
        <View style={styles.scanFrame} />
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d1a',
  },
  message: {color: '#fff', fontSize: 16, marginBottom: 20},
  permBtn: {
    backgroundColor: '#9945FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permBtnText: {color: '#fff', fontWeight: '700'},
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 60,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#9945FF',
    borderRadius: 16,
  },
  cancelBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelBtnText: {color: '#fff', fontWeight: '600', fontSize: 16},
});
