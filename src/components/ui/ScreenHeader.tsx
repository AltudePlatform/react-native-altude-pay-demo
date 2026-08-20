/**
 * Screen header.
 *
 * Every stack screen previously improvised its own back affordance: PayAddress
 * rendered "Back" as a peer of "Scan QR", Receipt put it below the primary CTA,
 * Scan called it "Cancel", and History had none at all. This gives them one
 * consistent, accessible control.
 *
 * Built as an in-screen component because react-native-screens is shimmed to
 * plain Views in metro.config.js, so native-stack headers are unavailable.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import {tokens} from '../../theme/tokens';
import {Icon, type IconName} from './Icon';

type HeaderAction = {
  icon?: IconName;
  label?: string;
  onPress: () => void;
  accessibilityLabel: string;
};

type ScreenHeaderProps = {
  title?: string;
  eyebrow?: string;
  onBack?: () => void;
  /** Use a close glyph instead of a back arrow (modal-style screens). */
  backVariant?: 'back' | 'close';
  backAccessibilityLabel?: string;
  action?: HeaderAction;
  style?: ViewStyle;
};

export function ScreenHeader({
  title,
  eyebrow,
  onBack,
  backVariant = 'back',
  backAccessibilityLabel,
  action,
  style,
}: ScreenHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.bar}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={
              backAccessibilityLabel ??
              (backVariant === 'close' ? 'Close' : 'Go back')
            }
            hitSlop={8}
            style={({pressed}) => [styles.iconBtn, pressed && styles.pressed]}>
            <Icon
              name={backVariant === 'close' ? 'close' : 'arrowLeft'}
              size={tokens.icon.lg}
              color={tokens.color.textPrimary}
            />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}

        {action ? (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            hitSlop={8}
            style={({pressed}) => [
              action.label ? styles.textAction : styles.iconBtn,
              pressed && styles.pressed,
            ]}>
            {action.icon ? (
              <Icon
                name={action.icon}
                size={tokens.icon.lg}
                color={tokens.color.textSecondary}
              />
            ) : (
              <Text style={styles.actionLabel}>{action.label}</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: tokens.spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: tokens.layout.touchTarget,
  },
  iconBtn: {
    width: tokens.layout.touchTarget,
    height: tokens.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -tokens.spacing.md,
  },
  textAction: {
    minHeight: tokens.layout.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
    marginRight: -tokens.spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  actionLabel: {
    ...tokens.type.label,
    color: tokens.color.brand,
  },
  eyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.color.textMuted,
    marginTop: tokens.spacing.md,
  },
  title: {
    ...tokens.type.title,
    color: tokens.color.textPrimary,
    marginTop: tokens.spacing.sm,
  },
});

export default ScreenHeader;
