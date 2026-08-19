/**
 * Balance display.
 *
 * The one oversized value on a screen. Deliberately not a card: on Home the
 * balance previously sat inside a bordered box below a gradient hero whose
 * headline was a truncated base58 address, which inverted the hierarchy.
 *
 * The value auto-shrinks rather than clipping, so large balances and long
 * currency formats stay readable at 320pt.
 */
import React from 'react';
import {StyleSheet, Text, View, type ViewStyle} from 'react-native';

import {tokens} from '../../theme/tokens';
import {Skeleton} from './Skeleton';

type BalanceDisplayProps = {
  label: string;
  value: string;
  meta?: string;
  loading?: boolean;
  align?: 'left' | 'center';
  style?: ViewStyle;
};

export function BalanceDisplay({
  label,
  value,
  meta,
  loading = false,
  align = 'left',
  style,
}: BalanceDisplayProps): React.JSX.Element {
  const alignment: ViewStyle = {
    alignItems: align === 'center' ? 'center' : 'flex-start',
  };

  return (
    <View style={[styles.root, alignment, style]}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>

      {loading ? (
        <Skeleton width="72%" height={56} radius="md" style={styles.skeleton} />
      ) : (
        <Text
          style={styles.value}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          accessibilityRole="text"
          accessibilityLabel={`${label}: ${value}`}>
          {value}
        </Text>
      )}

      {meta && !loading ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.spacing.md,
  },
  label: {
    ...tokens.type.eyebrow,
    color: tokens.color.textMuted,
  },
  value: {
    ...tokens.type.displayXL,
    color: tokens.color.textPrimary,
  },
  skeleton: {
    marginVertical: tokens.spacing.sm,
  },
  meta: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
  },
});

export default BalanceDisplay;
