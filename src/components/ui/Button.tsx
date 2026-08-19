/**
 * Button.
 *
 * Replaces nine near-duplicate implementations (payBtn, primaryBtn, shareBtn,
 * retryBtn, permBtn, secondaryBtn, cancelBtn, continueBtn, closeBtn).
 *
 * Uses Pressable rather than TouchableOpacity so pressed state is a real tonal
 * step instead of a blanket opacity fade, and so disabled state is exposed to
 * assistive technology via accessibilityState rather than only visually.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import {tokens} from '../../theme/tokens';
import {Icon, type IconName} from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  testID?: string;
};

const HEIGHT: Record<ButtonSize, number> = {
  sm: tokens.layout.touchTarget,
  md: 52,
  lg: 56,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps): React.JSX.Element {
  const inactive = disabled || loading;
  const fg = foreground(variant, inactive);

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled: inactive, busy: loading}}
      style={({pressed}) => [
        styles.base,
        {height: HEIGHT[size]},
        fullWidth && styles.fullWidth,
        surface(variant, inactive),
        pressed && !inactive && pressedSurface(variant),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={tokens.icon.md} color={fg} /> : null}
          <Text style={[styles.label, {color: fg}]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function surface(variant: ButtonVariant, inactive: boolean): ViewStyle {
  if (inactive) {
    return {
      backgroundColor:
        variant === 'ghost' ? 'transparent' : tokens.color.disabledSurface,
      borderColor: tokens.color.borderHairline,
    };
  }

  switch (variant) {
    case 'primary':
      return {
        backgroundColor: tokens.color.brandSurface,
        borderColor: tokens.color.brandSurface,
      };
    case 'secondary':
      return {
        backgroundColor: tokens.color.surface,
        borderColor: tokens.color.borderStrong,
      };
    case 'destructive':
      return {
        backgroundColor: tokens.color.tint.error,
        borderColor: tokens.color.error,
      };
    case 'ghost':
    default:
      return {backgroundColor: 'transparent', borderColor: 'transparent'};
  }
}

function pressedSurface(variant: ButtonVariant): ViewStyle {
  switch (variant) {
    case 'primary':
      // One tonal step darker rather than an opacity fade.
      return {backgroundColor: tokens.color.brand, borderColor: tokens.color.brand};
    case 'secondary':
      return {backgroundColor: tokens.color.surfaceElevated};
    case 'destructive':
      return {backgroundColor: tokens.color.tint.errorPressed};
    case 'ghost':
    default:
      return {backgroundColor: tokens.color.surface};
  }
}

function foreground(variant: ButtonVariant, inactive: boolean): string {
  if (inactive) {
    return tokens.color.textMuted;
  }
  switch (variant) {
    case 'primary':
      return tokens.color.textPrimary;
    case 'destructive':
      return tokens.color.error;
    case 'secondary':
    case 'ghost':
    default:
      return tokens.color.textPrimary;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xxl,
    borderWidth: tokens.border.strong,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  label: {
    ...tokens.type.action,
  },
});

export default Button;
