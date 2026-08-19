import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {tokens} from '../theme/tokens';
import {Icon} from './ui/Icon';

type InsufficientBalanceNoticeProps = {
  available: number;
};

export function InsufficientBalanceNotice({
  available,
}: InsufficientBalanceNoticeProps): React.JSX.Element {
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Icon
        name="alert"
        size={tokens.icon.md}
        color={tokens.color.error}
        strokeWidth={2}
      />
      <View style={styles.text}>
        <Text style={styles.title}>Not enough balance</Text>
        <Text style={styles.body}>
          {`You can send up to $${available.toFixed(2)}.`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
    backgroundColor: tokens.color.tint.error,
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.error,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },
  text: {
    flex: 1,
    gap: tokens.spacing.xxs,
  },
  title: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.color.error,
  },
  body: {
    ...tokens.type.caption,
    color: tokens.color.textSecondary,
  },
});
