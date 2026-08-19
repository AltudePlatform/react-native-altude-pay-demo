/**
 * Circular action.
 *
 * A large round icon control with a concise label beneath it - the primary
 * action affordance on the dashboard. Meets the 44pt minimum by construction.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View, type ViewStyle} from 'react-native';

import {tokens} from '../../theme/tokens';
import {Icon, type IconName} from './Icon';

type CircularActionProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** Emphasized fill for the single primary action in a group. */
  emphasis?: 'primary' | 'default';
  disabled?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
};

const SIZE = 60;

export function CircularAction({
  icon,
  label,
  onPress,
  emphasis = 'default',
  disabled = false,
  accessibilityHint,
  style,
}: CircularActionProps): React.JSX.Element {
  const primary = emphasis === 'primary';
  const foreground = disabled
    ? tokens.color.textMuted
    : primary
      ? tokens.color.textPrimary
      : tokens.color.brand;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled}}
      style={[styles.root, style]}>
      {({pressed}) => (
        <>
          <View
            style={[
              styles.circle,
              {
                backgroundColor: disabled
                  ? tokens.color.disabledSurface
                  : primary
                    ? tokens.color.brandSurface
                    : tokens.color.surface,
                borderColor: disabled
                  ? tokens.color.borderHairline
                  : primary
                    ? tokens.color.brandSurface
                    : tokens.color.borderStrong,
              },
              pressed && !disabled && styles.circlePressed,
            ]}>
            <Icon name={icon} size={tokens.icon.action} color={foreground} />
          </View>
          <Text
            style={[styles.label, disabled && styles.labelDisabled]}
            numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: tokens.spacing.md,
    minWidth: SIZE,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: tokens.border.strong,
  },
  circlePressed: {
    // Tonal step plus a slight contraction, rather than an opacity fade.
    backgroundColor: tokens.color.surfaceElevated,
    transform: [{scale: 0.96}],
  },
  label: {
    ...tokens.type.caption,
    fontWeight: '600',
    color: tokens.color.textSecondary,
  },
  labelDisabled: {
    color: tokens.color.textMuted,
  },
});

export default CircularAction;
