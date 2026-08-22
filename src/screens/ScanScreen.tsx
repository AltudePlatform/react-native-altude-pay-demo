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
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {Button, Icon, Screen, ScreenHeader} from '../components/ui';
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

  if (Platform.OS === 'android') {
    return (
      <Screen>
        <ScreenHeader
          onBack={() => navigation.goBack()}
          backVariant="close"
          eyebrow="Scan"
        />
        <View style={styles.message}>
          <Icon name="scan" size={32} color={tokens.color.textMuted} />
          <Text style={styles.title}>QR scanning unavailable</Text>
          <Text style={styles.body}>
            QR scanning is not available in this Android build. Enter the
            payment address manually instead.
          </Text>
        </View>
      </Screen>
    );
  }

  return <CameraScanner navigation={navigation} />;
}

function CameraScanner({navigation}: {navigation: NavProp}): React.JSX.Element {
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
      if (scanned) {
        return;
      }
      const first = codes[0]?.value;
      if (!first) {
        return;
      }

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
      <Screen>
        <ScreenHeader
          onBack={() => navigation.goBack()}
          backVariant="close"
          eyebrow="Scan"
        />
        <View style={styles.message}>
          <Icon name="scan" size={32} color={tokens.color.textMuted} />
          <Text style={styles.title}>Camera permission required</Text>
          <Text style={styles.body}>Grant access to scan payment codes.</Text>
          <Button
            label="Grant permission"
            fullWidth={false}
            onPress={async () => {
              const status = await Camera.requestCameraPermission();
              setHasPermission(status === 'granted');
            }}
            style={styles.action}
          />
        </View>
      </Screen>
    );
  }

  if (!device) {
    return (
      <Screen>
        <ScreenHeader
          onBack={() => navigation.goBack()}
          backVariant="close"
          eyebrow="Scan"
        />
        <View style={styles.message}>
          <Icon name="alert" size={32} color={tokens.color.textMuted} />
          <Text style={styles.title}>Camera not available</Text>
          <Text style={styles.body}>Try again on a device with a rear camera.</Text>
        </View>
      </Screen>
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

      <SafeAreaView style={styles.overlay}>
        <View style={styles.overlayHeader}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
            hitSlop={8}
            style={({pressed}) => [styles.closeBtn, pressed && styles.pressed]}>
            <Icon name="close" size={tokens.icon.lg} color={tokens.color.textPrimary} />
          </Pressable>
          <Text style={styles.overlayTitle}>Point at a payment QR code</Text>
        </View>

        <View style={styles.scanFrame} />

        <Text style={styles.overlayHint}>
          The camera will prefill the address and amount.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: tokens.color.canvas},
  message: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing.lg,
    paddingBottom: tokens.spacing.giant,
  },
  title: {
    ...tokens.type.title,
    color: tokens.color.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  action: {
    marginTop: tokens.spacing.md,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxl,
    paddingHorizontal: tokens.layout.gutter,
    // Dark scrim. A light wash over a camera feed washed out the preview.
    backgroundColor: tokens.color.scrim.camera,
  },
  overlayHeader: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: tokens.spacing.lg,
  },
  closeBtn: {
    alignSelf: 'flex-start',
    width: tokens.layout.touchTarget,
    height: tokens.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  overlayTitle: {
    ...tokens.type.heading,
    color: tokens.color.textPrimary,
    textAlign: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: tokens.color.brand,
    borderRadius: tokens.radius.lg,
  },
  overlayHint: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
});
