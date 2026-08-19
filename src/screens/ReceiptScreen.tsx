import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

import {PAYMENT_TRANSACTION_TYPE, transactionTypeLabel} from '../services/altudeHistory';
import {buildSolscanTxUrl} from '../services/explorer';
import {truncateAddress} from '../services/solana';
import {getHistory} from '../services/storage';
import {tokens} from '../theme/tokens';
import {RootStackParamList, TransactionRecord} from '../types';

type NavProp = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'Receipt'>;

export default function ReceiptScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const {signature} = useRoute<RouteType>().params;

  const [record, setRecord] = useState<TransactionRecord | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    getHistory().then(records => {
      setRecord(records.find(item => item.signature === signature) ?? null);
    });
  }, [signature]);

  const handleOpenSolscan = useCallback(async () => {
    setIsOpening(true);
    try {
      await Linking.openURL(await buildSolscanTxUrl(signature));
    } catch {
      Alert.alert('Solscan is unreachable', 'Check your connection and try again.');
    } finally {
      setIsOpening(false);
    }
  }, [signature]);

  const handleCopySignature = useCallback(() => {
    Clipboard.setString(signature);
  }, [signature]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill} width="110%" height="110%">
          <Defs>
            <LinearGradient id="receiptHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={tokens.gradient.heroFrom} />
              <Stop offset="55%" stopColor={tokens.gradient.heroMid} />
              <Stop offset="100%" stopColor={tokens.gradient.heroTo} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#receiptHeroGradient)" />
        </Svg>

        <Text style={styles.kicker}>RECEIPT</Text>
        <Text style={styles.heroAmount}>
          {record ? `$${record.amount.toFixed(2)}` : transactionTypeLabel(PAYMENT_TRANSACTION_TYPE)}
        </Text>
        {record ? (
          <Text style={styles.heroHint}>{`to ${truncateAddress(record.recipient, 6)}`}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Row label="Type" value={transactionTypeLabel(PAYMENT_TRANSACTION_TYPE)} />
        {record ? <Row label="Status" value={record.status} /> : null}
        {record ? (
          <Row label="Date" value={new Date(record.date).toLocaleString()} />
        ) : null}
        {record ? <Row label="Recipient" value={truncateAddress(record.recipient, 6)} /> : null}

        <Text style={styles.label}>Transaction signature</Text>
        <TouchableOpacity onPress={handleCopySignature}>
          <Text style={styles.signature}>{signature}</Text>
          <Text style={styles.copyHint}>Tap to copy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleOpenSolscan}
          disabled={isOpening}>
          {isOpening ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryBtnText}>Open in Solscan</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({label, value}: {label: string; value: string}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.page,
  },
  content: {
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  hero: {
    minHeight: 150,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 16,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  kicker: {
    ...tokens.type.eyebrow,
    color: tokens.onAccent.secondary,
  },
  heroAmount: {
    ...tokens.type.display,
    marginTop: 6,
    color: tokens.onAccent.primary,
  },
  heroHint: {
    ...tokens.type.label,
    marginTop: 4,
    color: tokens.onAccent.muted,
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  rowLabel: {
    ...tokens.type.label,
    color: tokens.colors.textMuted,
  },
  rowValue: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    textTransform: 'capitalize',
  },
  label: {
    ...tokens.type.label,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xs,
    color: tokens.colors.textMuted,
  },
  signature: {
    ...tokens.type.mono,
    color: tokens.colors.textPrimary,
    backgroundColor: tokens.colors.page,
    borderRadius: tokens.radius.sm,
    padding: 12,
  },
  copyHint: {
    ...tokens.type.caption,
    fontWeight: '600',
    marginTop: tokens.spacing.xs,
    color: tokens.colors.textMuted,
  },
  primaryBtn: {
    marginTop: tokens.spacing.lg,
    backgroundColor: tokens.colors.accent,
    borderRadius: tokens.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...tokens.type.action,
    color: tokens.onAccent.primary,
  },
  secondaryBtn: {
    marginTop: tokens.spacing.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...tokens.type.body,
    fontWeight: '700',
    color: tokens.colors.textMuted,
  },
});
