import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {Circle, Path} from 'react-native-svg';

import {tokens} from '../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type AscentState = 'active' | 'success' | 'error';

type AscentIndicatorProps = {
  progress: number;
  state?: AscentState;
  size?: number;
  tint?: string;
  trackColor?: string;
};

const CHEVRONS = [0, 1, 2];

export function AscentIndicator({
  progress,
  state = 'active',
  size = 168,
  tint = tokens.color.textPrimary,
  trackColor = tokens.color.borderStrong,
}: AscentIndicatorProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const strokeWidth = Math.max(6, Math.round(size * 0.05));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arc = useSharedValue(0);
  const climb = useSharedValue(reduceMotion ? 1 : 0);
  const mark = useSharedValue(0);

  const resolved = state !== 'active';
  const target = resolved ? 1 : Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    arc.value = withTiming(target, {
      duration: reduceMotion ? 0 : tokens.motion.slow,
      easing: Easing.out(Easing.cubic),
    });
  }, [arc, reduceMotion, target]);

  useEffect(() => {
    if (resolved || reduceMotion) {
      cancelAnimation(climb);
      climb.value = 1;
      return;
    }

    climb.value = 0;
    climb.value = withRepeat(
      withTiming(1, {
        duration: tokens.motion.ascent,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      false,
    );

    return () => cancelAnimation(climb);
  }, [climb, reduceMotion, resolved]);

  useEffect(() => {
    mark.value = resolved
      ? withDelay(
          reduceMotion ? 0 : tokens.motion.fast,
          withSequence(
            withTiming(1.12, {duration: reduceMotion ? 0 : tokens.motion.fast}),
            withTiming(1, {duration: reduceMotion ? 0 : tokens.motion.fast}),
          ),
        )
      : withTiming(0, {duration: reduceMotion ? 0 : tokens.motion.fast});
  }, [mark, reduceMotion, resolved]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - arc.value),
  }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: Math.min(mark.value, 1),
    transform: [{scale: 0.6 + mark.value * 0.4}],
  }));

  const strokeColor =
    state === 'error'
      ? tokens.color.error
      : state === 'success'
        ? tokens.color.success
        : tint;

  return (
    <View style={[styles.wrap, {width: size, height: size}]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          animatedProps={arcProps}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          fill="none"
          originX={size / 2}
          originY={size / 2}
          rotation={-90}
        />
      </Svg>

      {resolved ? (
        <Animated.View style={[styles.center, markStyle]}>
          <Svg width={size * 0.4} height={size * 0.4} viewBox="0 0 40 40">
            <Path
              d={state === 'error' ? 'M12 12 L28 28 M28 12 L12 28' : 'M10 21 L17 28 L30 13'}
              stroke={strokeColor}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      ) : (
        <View style={styles.center} pointerEvents="none">
          {CHEVRONS.map(index => (
            <Chevron
              key={index}
              index={index}
              climb={climb}
              tint={tint}
              size={size * 0.22}
              reduceMotion={reduceMotion}
            />
          ))}
        </View>
      )}
    </View>
  );
}

type ChevronProps = {
  index: number;
  climb: ReturnType<typeof useSharedValue<number>>;
  tint: string;
  size: number;
  reduceMotion: boolean;
};

function Chevron({
  index,
  climb,
  tint,
  size,
  reduceMotion,
}: ChevronProps): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {opacity: 0.35 + index * 0.2, transform: [{translateY: 0}]};
    }

    // Each chevron peaks a third of a cycle after the one below it.
    const phase = (climb.value + index / CHEVRONS.length) % 1;
    const wave = Math.sin(phase * Math.PI);

    return {
      opacity: 0.25 + wave * 0.75,
      transform: [{translateY: (1 - wave) * 5}],
    };
  });

  return (
    <Animated.View style={[styles.chevron, style]}>
      <Svg width={size} height={size * 0.5} viewBox="0 0 24 12">
        <Path
          d="M2 10 L12 2 L22 10"
          stroke={tint}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginVertical: 1,
  },
});
