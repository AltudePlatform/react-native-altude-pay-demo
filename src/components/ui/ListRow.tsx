/**
 * List row.
 *
 * One treatment for both Home's activity preview (previously borderless
 * divider rows) and History's list (previously a bordered card per item).
 * Structure comes from typography, spacing, and a leading mark rather than a
 * box around every entry.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View, type ViewStyle} from 'react-native';

import {tokens} from '../../theme/tokens';
import {Icon, type IconName} from './Icon';

type ListRowProps = {
  title: string;
  /** Secondary line, e.g. a relative date. */
  subtitle?: string;
  /** Right-aligned primary value. */
  value?: string;
  /** Right-aligned secondary line under the value. */
  valueMeta?: string;
  leadingIcon?: IconName;
  leadingTone?: 'brand' | 'success' | 'error' | 'neutral';
  trailing?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Hairline divider above the row. Off for the first item in a group. */
  divided?: boolean;
  style?: ViewStyle;
};

const TONE = {
  brand: {fg: tokens.color.brand, bg: tokens.color.tint.brand},
  success: {fg: tokens.color.success, bg: tokens.color.tint.success},
  error: {fg: tokens.color.error, bg: tokens.color.tint.error},
  neutral: {fg: tokens.color.textSecondary, bg: tokens.color.surfaceElevated},
} as const;

export function ListRow({
  title,
  subtitle,
  value,
  valueMeta,
  leadingIcon,
  leadingTone = 'neutral',
  trailing,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  divided = true,
  style,
}: ListRowProps): React.JSX.Element {
  const tone = TONE[leadingTone];

  const body = (
    <>
      {leadingIcon ? (
        <View style={[styles.mark, {backgroundColor: tone.bg}]}>
          <Icon name={leadingIcon} size={tokens.icon.md} color={tone.fg} />
        </View>
      ) : null}

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {value || valueMeta ? (
        <View style={styles.valueBlock}>
          {value ? (
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          {valueMeta ? (
            <Text style={styles.valueMeta} numberOfLines={1}>
              {valueMeta}
            </Text>
          ) : null}
        </View>
      ) : null}

      {trailing}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, divided && styles.divided, style]}>{body}</View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      style={({pressed}) => [
        styles.row,
        divided && styles.divided,
        pressed && styles.pressed,
        style,
      ]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.lg,
    minHeight: tokens.layout.touchTarget + tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    // Bleed into the gutter so the pressed state reads as a full-width row.
    marginHorizontal: -tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
  },
  divided: {
    borderTopWidth: tokens.border.strong,
    borderTopColor: tokens.color.borderHairline,
  },
  pressed: {
    backgroundColor: tokens.color.surface,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: tokens.spacing.xxs,
  },
  title: {
    ...tokens.type.heading,
    color: tokens.color.textPrimary,
  },
  subtitle: {
    ...tokens.type.caption,
    color: tokens.color.textMuted,
  },
  valueBlock: {
    alignItems: 'flex-end',
    gap: tokens.spacing.xxs,
    flexShrink: 0,
  },
  value: {
    ...tokens.type.monoValue,
    color: tokens.color.textPrimary,
  },
  valueMeta: {
    ...tokens.type.caption,
    color: tokens.color.textMuted,
  },
});

export default ListRow;
