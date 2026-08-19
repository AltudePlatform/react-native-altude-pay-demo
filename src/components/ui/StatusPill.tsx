/**
 * Status pill.
 *
 * Replaces `textTransform: 'capitalize'` on a raw status string and the
 * one-off "PAY" empty-state badge. Status is always icon + text, never colour
 * alone, so it survives a colour-vision deficiency.
 */
import React from 'react';
import {StyleSheet, Text, View, type ViewStyle} from 'react-native';

import {tokens} from '../../theme/tokens';
import {Icon, type IconName} from './Icon';

export type StatusTone = 'success' | 'pending' | 'error' | 'neutral';

type StatusPillProps = {
  tone: StatusTone;
  label: string;
  style?: ViewStyle;
};

const TONE: Record<
  StatusTone,
  {fg: string; bg: string; icon: IconName}
> = {
  success: {
    fg: tokens.color.success,
    bg: tokens.color.tint.success,
    icon: 'check',
  },
  pending: {
    fg: tokens.color.warning,
    bg: tokens.color.tint.warning,
    icon: 'clock',
  },
  error: {
    fg: tokens.color.error,
    bg: tokens.color.tint.error,
    icon: 'alert',
  },
  neutral: {
    fg: tokens.color.textSecondary,
    bg: tokens.color.surfaceElevated,
    icon: 'clock',
  },
};

export function StatusPill({
  tone,
  label,
  style,
}: StatusPillProps): React.JSX.Element {
  const {fg, bg, icon} = TONE[tone];

  return (
    <View style={[styles.pill, {backgroundColor: bg}, style]}>
      <Icon name={icon} size={tokens.icon.sm} color={fg} strokeWidth={2.25} />
      <Text style={[styles.label, {color: fg}]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Maps the app's TransactionRecord status strings onto a tone. */
export function toneForStatus(status: string | null | undefined): StatusTone {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'pending';
    case 'failed':
      return 'error';
    default:
      return 'neutral';
  }
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.pill,
  },
  label: {
    ...tokens.type.caption,
    fontWeight: '700',
  },
});

export default StatusPill;
