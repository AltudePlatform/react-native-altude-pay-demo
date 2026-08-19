import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import Animated, {FadeIn, useReducedMotion} from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';

import {tokens} from '../theme/tokens';

export type Stage = {
  key: string;
  label: string;
};

type StageListProps = {
  stages: readonly Stage[];
  activeIndex: number;
  failed?: boolean;
};

export function StageList({
  stages,
  activeIndex,
  failed = false,
}: StageListProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.list}>
      {stages.map((stage, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        const stalled = active && failed;

        return (
          <Animated.View
            key={stage.key}
            entering={reduceMotion ? undefined : FadeIn.delay(index * 80)}
            style={styles.row}>
            <View
              style={[
                styles.bullet,
                done && styles.bulletDone,
                stalled && styles.bulletFailed,
              ]}>
              {done ? (
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  <Path
                    d="M5 13 L10 18 L19 6"
                    stroke={tokens.color.canvas}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              ) : active && !failed ? (
                <ActivityIndicator size="small" color={tokens.color.brand} />
              ) : null}
            </View>

            <Text
              style={[
                styles.label,
                (done || active) && styles.labelOn,
                stalled && styles.labelFailed,
              ]}>
              {stage.label}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: tokens.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  bullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: tokens.color.borderStrong,
  },
  bulletDone: {
    backgroundColor: tokens.color.success,
    borderColor: tokens.color.success,
  },
  bulletFailed: {
    backgroundColor: tokens.color.error,
    borderColor: tokens.color.error,
  },
  label: {
    ...tokens.type.body,
    fontWeight: '600',
    color: tokens.color.textMuted,
  },
  labelOn: {
    color: tokens.color.textPrimary,
  },
  labelFailed: {
    color: tokens.color.error,
  },
});
