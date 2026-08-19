/**
 * Surface.
 *
 * A tonal container. Replaces the hand-written `card`, `formCard`, `qrCard`,
 * and `accountPanel` styles. Depth comes from the tonal step plus a hairline
 * border, not from a shadow on every element.
 */
import React from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';

import {tokens} from '../../theme/tokens';

type SurfaceProps = {
  children: React.ReactNode;
  /** `high` is for content that floats above the page (sheets, toasts). */
  level?: 'base' | 'elevated' | 'high';
  padded?: boolean;
  bordered?: boolean;
  raised?: boolean;
  radius?: keyof typeof tokens.radius;
  style?: ViewStyle;
};

export function Surface({
  children,
  level = 'base',
  padded = true,
  bordered = true,
  raised = false,
  radius = 'lg',
  style,
}: SurfaceProps): React.JSX.Element {
  return (
    <View
      style={[
        {
          backgroundColor: BACKGROUND[level],
          borderRadius: tokens.radius[radius],
        },
        padded && styles.padded,
        bordered && styles.bordered,
        raised && tokens.elevation.raised,
        style,
      ]}>
      {children}
    </View>
  );
}

const BACKGROUND = {
  base: tokens.color.surface,
  elevated: tokens.color.surfaceElevated,
  high: tokens.color.surfaceHigh,
} as const;

const styles = StyleSheet.create({
  padded: {
    padding: tokens.spacing.xl,
  },
  bordered: {
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.borderHairline,
  },
});

export default Surface;
