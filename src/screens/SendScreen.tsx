import React, {useCallback, useState} from 'react';
import {View, Text, Pressable, StyleSheet, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import {useBalance} from '../hooks/useBalance';
import {InsufficientBalanceNotice} from '../components/InsufficientBalanceNotice';
import {Button, Icon, Screen} from '../components/ui';
import {formatUsd} from '../utils/format';
import {RootStackParamList} from '../types';
import {tokens} from '../theme/tokens';

type NavProp = StackNavigationProp<RootStackParamList>;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const;

export default function SendScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const [amount, setAmount] = useState('0');
  const {data: balance} = useBalance();
  const availableBalance = balance?.usdcBalance;

  const parsedAmount = parseFloat(amount);
  const exceedsBalance =
    availableBalance !== undefined &&
    !isNaN(parsedAmount) &&
    parsedAmount > availableBalance;

  /**
   * The CTA used to be disabled only when the amount exceeded the balance, so
   * at $0 it looked actionable and then raised an alert. Disabling here makes
   * that alert path unreachable.
   */
  const isEmptyAmount = isNaN(parsedAmount) || parsedAmount <= 0;

  const handleKeypadTap = useCallback((value: string) => {
    setAmount(current => {
      if (value === 'back') {
        const next = current.slice(0, -1);
        return next.length === 0 ? '0' : next;
      }

      if (value === '.') {
        if (current.includes('.')) {
          return current;
        }
        return `${current}.`;
      }

      if (current === '0') {
        return value;
      }

      const [, decimals = ''] = current.split('.');
      if (current.includes('.') && decimals.length >= 6) {
        return current;
      }

      return `${current}${value}`;
    });
  }, []);

  const handlePay = useCallback(() => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validation Error', 'Enter an amount greater than 0.');
      return;
    }

    if (availableBalance !== undefined && parsed > availableBalance) {
      Alert.alert(
        'Amount is too high',
        `You only have ${formatUsd(availableBalance)} available.`,
      );
      return;
    }

    navigation.navigate('PayAddress', {amount});
  }, [amount, availableBalance, navigation]);

  const amountDisplay = amount === '0' ? '$0' : `$${amount}`;

  return (
    <Screen avoidKeyboard edgeBottom={false} contentStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>AMOUNT</Text>
        <Text
          style={styles.amount}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
          accessibilityLabel={`Amount ${amountDisplay}`}>
          {amountDisplay}
        </Text>
        <Text style={styles.tokenLabel}>
          {availableBalance === undefined
            ? 'How much do you want to pay?'
            : `${formatUsd(availableBalance)} available`}
        </Text>
      </View>

      <View style={styles.keypadWrap}>
        {KEYS.map(key => (
          <Pressable
            key={key}
            style={({pressed}) => [styles.key, pressed && styles.keyPressed]}
            onPress={() => handleKeypadTap(key)}
            accessibilityRole="button"
            accessibilityLabel={KEY_LABELS[key]}>
            {key === 'back' ? (
              <Icon
                name="backspace"
                size={tokens.icon.action}
                color={tokens.color.textPrimary}
              />
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>

      {exceedsBalance && availableBalance !== undefined ? (
        <InsufficientBalanceNotice available={availableBalance} />
      ) : null}

      <Button
        label="Pay"
        onPress={handlePay}
        disabled={exceedsBalance || isEmptyAmount}
        style={styles.payBtn}
      />
    </Screen>
  );
}

const KEY_LABELS: Record<(typeof KEYS)[number], string> = {
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '0': '0',
  '.': 'Decimal point',
  back: 'Delete last digit',
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xxxl,
    gap: tokens.spacing.md,
  },
  kicker: {
    ...tokens.type.eyebrow,
    color: tokens.color.textMuted,
  },
  amount: {
    ...tokens.type.displayXL,
    color: tokens.color.textPrimary,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  tokenLabel: {
    ...tokens.type.label,
    color: tokens.color.textSecondary,
  },
  keypadWrap: {
    marginBottom: tokens.spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.lg,
    minHeight: 64,
    borderRadius: tokens.radius.md,
  },
  keyPressed: {
    // A real tonal step rather than a blanket opacity fade.
    backgroundColor: tokens.color.surface,
  },
  keyText: {
    ...tokens.type.displayLG,
    fontWeight: '500',
    letterSpacing: 0,
    color: tokens.color.textPrimary,
  },
  payBtn: {
    marginTop: tokens.spacing.lg,
  },
});