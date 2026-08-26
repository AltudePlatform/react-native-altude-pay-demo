import React, {useCallback, useEffect, useState} from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import {buildSolscanTxUrl} from '../services/explorer';
import {truncateAddress, getSignatureHistory} from '../services/solana';
import {useWalletStore} from '../store/walletStore';
import {formatAbsoluteDate, formatUsd} from '../utils/format';
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
import {
  GetHistorySummary,
  RootStackParamList,
  TransactionRecord,
  TransactionStatus,
} from '../types';


type NavProp = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'Receipt'>;

type ReceiptRecord = {
  amount: number;
  status: TransactionStatus;
  direction: 'send' | 'receive';
  date: string | null;
  otherWallet: string | null;
  recipient: string | null;
};

function fromStoredRecord(record: GetHistorySummary): GetHistorySummary {
  return record;
}

function fromChainRecord(record: GetHistorySummary): GetHistorySummary {
  const direction = record.type === 'receive' ? 'receive' : 'send';

  return {
    amount: record.amount,
    status: record.status === 'success' ? 'success' : 'failed',
    type: record.type,
    blockTime: record.blockTime === null ? null : record.blockTime,
    from: record.from,
    to: record.to,
    signature: '',
    slot: 0
  };
}

export default function ReceiptScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const {receiptData} = useRoute<RouteType>().params;
  const {showToast} = useToast();

  const [record, setRecord] = useState<GetHistorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);

  const wallet = useWalletStore(s => s.wallet);

  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoading(true);
      setRecord(null);

      let storedRecord: GetHistorySummary | undefined;
      try {
        //const localHistory = await getHistory();
        storedRecord = receiptData;
        if (storedRecord && active) {
          setRecord(fromStoredRecord(storedRecord));
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[ReceiptScreen] Error loading local receipt:', error);
      }

      if (receiptData.signature.startsWith('MOCK_SIG_') || !wallet?.publicKey) {
        if (active) {
          setIsLoading(false);
        }
        return;
      }

      // const chainRecord = await getSignatureHistory(wallet.publicKey, receiptData.signature);
      // if (active) {
      //   if (chainRecord) {
      //     setRecord(fromChainRecord(chainRecord));
      //   }
      //   setIsLoading(false);
      // }
    })();

    return () => {
      active = false;
    };
  }, [receiptData.signature, wallet?.publicKey]);

  const isSend = record?.type === 'send';
  const directionLabel = record
    ? isSend
      ? 'Payment'
      : 'Incoming payment'
    : 'Payment details';

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
        label={directionLabel}
        value={record ? formatUsd(record.amount) : 'Unavailable'}
        loading={isLoading}
        meta={
          record?.to
            ? (isSend ? 'to ' : 'from ') +
              truncateAddress(record.to, 6)
            : undefined
        }
      />

      <Surface style={styles.card}>
        <Row label="Type" value={directionLabel} />
        {record ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <StatusPill tone={toneForStatus(record.status)} label={record.status} />
          </View>
        ) : null}
        {record?.blockTime ? (
          <Row label="Date" value={formatAbsoluteDate(new Date((record.blockTime ?? 0) * 1000).toString())} />
        ) : null}
        {record?.to ? (
          <Row
            label="Recipient"
            value={truncateAddress(record.to, 6)}
          />
        ) : null}
        {!isLoading && !record ? (
          <View style={styles.unavailable}>
            <Text style={styles.unavailableTitle}>Receipt unavailable</Text>
            <Text style={styles.unavailableBody}>
              Payment details could not be found on this device or on Solana.
            </Text>
          </View>
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
  unavailable: {
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xl,
    borderBottomWidth: tokens.border.strong,
    borderBottomColor: tokens.color.borderHairline,
  },
  unavailableTitle: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  unavailableBody: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
  },
  actions: {
    marginTop: tokens.spacing.xl,
    gap: tokens.spacing.md,
  },
});
