import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {tokens} from '../theme/tokens';

type InsufficientBalanceNoticeProps = {
  available: number;
};

export function InsufficientBalanceNotice({
  available,
}: InsufficientBalanceNoticeProps): React.JSX.Element {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Not enough balance</Text>
      <Text style={styles.body}>
        {`You can send up to $${available.toFixed(2)}.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fdf1ee',
    borderRadius: tokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 14,
    gap: 2,
  },
  title: {
    ...tokens.type.heading,
    color: tokens.colors.danger,
  },
  body: {
    ...tokens.type.label,
    fontWeight: '500',
    color: tokens.colors.textMuted,
  },
});
