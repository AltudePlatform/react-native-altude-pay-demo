/**
 * Scan Screen – uses react-native-vision-camera to scan a Solana Pay QR code.
 *
 * Parses the scanned URL and pre-fills the Send screen with:
 *  - recipient address
 *  - optional amount
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {tokens} from '../theme/tokens';

type NavProp = StackNavigationProp<RootStackParamList>;

function parseSolanaPayUrl(url: string): {
  recipient?: string;
  amount?: string;
} | null {
  // Solana Pay: solana:<address>?amount=<n>&...
  const match = url.match(/^solana:([1-9A-HJ-NP-Za-km-z]{32,44})(.*)?$/);
  if (!match) {return null;}

  const recipient = match[1];
  const params = new URLSearchParams(match[2]?.slice(1) ?? '');
  const amount = params.get('amount') ?? undefined;

  return {recipient, amount};
}

export default function ScanScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();

  // VisionCamera native module is intentionally disabled on Android for this demo build.
  if (Platform.OS === 'android') {
    return (
      <View style={styles.center}>
        <Text style={styles.kicker}>SCAN</Text>
        <Text style={styles.title}>Scanner unavailable on Android</Text>
        <Text style={styles.message}>Use Pay and paste a payment link instead.</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      if (scanned) {return;}
      const first = codes[0]?.value;
      if (!first) {return;}

      setScanned(true);
      const parsed = parseSolanaPayUrl(first);
      if (parsed?.recipient) {
        navigation.navigate('PayAddress', {
          amount: parsed.amount ?? '0',
          recipient: parsed.recipient,
        });
      } else {
        Alert.alert('Invalid QR', 'This QR code is not a valid payment link.', [
          {text: 'OK', onPress: () => setScanned(false)},
        ]);
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.kicker}>SCAN</Text>
        <Text style={styles.title}>Camera permission required</Text>
        <Text style={styles.message}>Grant access to scan payment codes.</Text>
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
        <Text style={styles.kicker}>SCAN</Text>
        <Text style={styles.title}>Camera not available</Text>
        <Text style={styles.message}>Try again on a device with a rear camera.</Text>
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
        <View style={styles.heroPanel}>
          <Text style={styles.kicker}>SCAN</Text>
          <Text style={styles.title}>Point at a payment QR code</Text>
          <Text style={styles.message}>The camera will prefill the address and amount.</Text>
        </View>
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
  container: {flex: 1, backgroundColor: tokens.colors.page},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.page,
    paddingHorizontal: 20,
  },
  kicker: {
    ...tokens.type.eyebrow,
    color: tokens.colors.textMuted,
    marginBottom: 8,
  },
  title: {
    ...tokens.type.title,
    color: tokens.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    ...tokens.type.body,
    color: tokens.colors.textMuted,
    marginBottom: 20,
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: tokens.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: tokens.radius.md,
  },
  permBtnText: {...tokens.type.body, fontWeight: '700', color: tokens.onAccent.primary},
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 28,
    backgroundColor: 'rgba(244, 247, 252, 0.2)',
  },
  heroPanel: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: tokens.radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: tokens.colors.accent,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtn: {
    backgroundColor: tokens.colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: tokens.radius.md,
  },
  cancelBtnText: {...tokens.type.action, color: tokens.onAccent.primary},
});
