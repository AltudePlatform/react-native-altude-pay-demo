import React, {useCallback, useState} from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import {buildSolscanTxUrl} from '../services/explorer';
import {truncateAddress} from '../services/solana';
import {formatAbsoluteDate, formatUsd} from '../utils/format';
import {getHistoryPresentation} from '../utils/historyPresentation';
import {
  BalanceDisplay,
  Button,
  Screen,
  ScreenHeader,
  StatusPill,
  Surface,
  toneForStatus,
  useToast,
} from '../components/ui';
import {tokens} from '../theme/tokens';
import {RootStackParamList} from '../types';

type NavProp = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'Receipt'>;

export default function ReceiptScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const {receiptData} = useRoute<RouteType>().params;
  const {showToast} = useToast();

  const [isOpening, setIsOpening] = useState(false);
  const record = receiptData;
  const presentation = getHistoryPresentation(record);

  const handleOpenSolscan = useCallback(async () => {
    setIsOpening(true);
    try {
      await Linking.openURL(await buildSolscanTxUrl(receiptData.signature));
    } catch {
      showToast('Solscan is unreachable. Check your connection.', 'error');
    } finally {
      setIsOpening(false);
    }
  }, [showToast, receiptData.signature]);

  const handleCopySignature = useCallback(() => {
    Clipboard.setString(receiptData.signature);
    showToast('Signature copied');
  }, [showToast, receiptData.signature]);

  return (
    <Screen scroll>
      <ScreenHeader onBack={() => navigation.goBack()} eyebrow="Receipt" />

      <BalanceDisplay
        label={presentation.title}
        value={formatUsd(record.amount)}
        meta={
          presentation.counterparty && presentation.counterpartyPrefix
            ? `${presentation.counterpartyPrefix} ${truncateAddress(
                presentation.counterparty,
                6,
              )}`
            : undefined
        }
      />

      <Surface style={styles.card}>
        <Row label="Type" value={presentation.title} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <StatusPill tone={toneForStatus(record.status)} label={record.status} />
        </View>
        {record.blockTime !== null ? (
          <Row
            label="Date"
            value={formatAbsoluteDate(
              new Date(record.blockTime * 1000).toString(),
            )}
          />
        ) : null}
        {presentation.counterparty && presentation.counterpartyLabel ? (
          <Row
            label={presentation.counterpartyLabel}
            value={truncateAddress(presentation.counterparty, 6)}
          />
        ) : null}

        <Text style={styles.label}>Transaction signature</Text>
        <Text style={styles.signature} selectable>
          {receiptData.signature}
        </Text>

        <View style={styles.actions}>
          <Button
            label="Copy signature"
            icon="copy"
            variant="secondary"
            onPress={handleCopySignature}
          />
          <Button
            label="Open in Solscan"
            icon="external"
            onPress={handleOpenSolscan}
            loading={isOpening}
          />
        </View>
      </Surface>
    </Screen>
  );
}

function Row({label, value}: {label: string; value: string}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {/* flexShrink so a long value wraps instead of shoving the label out. */}
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: tokens.spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    borderBottomWidth: tokens.border.strong,
    borderBottomColor: tokens.color.borderHairline,
  },
  rowLabel: {
    ...tokens.type.label,
    color: tokens.color.textMuted,
    flexShrink: 0,
  },
  rowValue: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  label: {
    ...tokens.type.label,
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.md,
    color: tokens.color.textMuted,
  },
  signature: {
    ...tokens.type.mono,
    color: tokens.color.textPrimary,
    backgroundColor: tokens.color.canvas,
    borderRadius: tokens.radius.sm,
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.borderHairline,
    padding: tokens.spacing.lg,
    lineHeight: 20,
  },
  actions: {
    marginTop: tokens.spacing.xl,
    gap: tokens.spacing.md,
  },
});
