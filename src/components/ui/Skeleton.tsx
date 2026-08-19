/**
 * Skeleton placeholder.
 *
 * Replaces bare ActivityIndicators that swapped out whole screens. History,
 * for example, previously replaced its entire body - including the header -
 * with a centred spinner, so the layout jumped once data arrived.
 *
 * The shimmer respects the reduced-motion setting.
 */
import React, {useEffect} from 'react';
import {StyleSheet, View, type DimensionValue, type ViewStyle} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {tokens} from '../../theme/tokens';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: keyof typeof tokens.radius;
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'sm',
  style,
}: SkeletonProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(reduceMotion ? 0.5 : 0.35);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(pulse);
      pulse.value = 0.5;
      return;
    }

    pulse.value = withRepeat(
      withTiming(0.75, {
        duration: tokens.motion.slow,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const animated = useAnimatedStyle(() => ({opacity: pulse.value}));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        styles.base,
        {width, height, borderRadius: tokens.radius[radius]},
        animated,
        style,
      ]}
    />
  );
}

/** A group of skeleton rows shaped like the activity list. */
export function SkeletonRows({count = 4}: {count?: number}): React.JSX.Element {
  return (
    <View accessibilityLabel="Loading activity">
      {Array.from({length: count}).map((_, index) => (
        <View key={index} style={styles.row}>
          <Skeleton width={40} height={40} radius="pill" />
          <View style={styles.rowText}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={11} />
          </View>
          <Skeleton width={62} height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: tokens.color.surfaceElevated,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    borderTopWidth: tokens.border.strong,
    borderTopColor: tokens.color.borderHairline,
  },
  rowText: {
    flex: 1,
    gap: tokens.spacing.md,
  },
});

export default Skeleton;
