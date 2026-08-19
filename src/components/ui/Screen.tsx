/**
 * Screen root.
 *
 * Owns the canvas colour, safe-area insets, and scroll/keyboard behaviour so
 * individual screens stop hand-rolling them. Before this, only 2 of 10 screens
 * applied safe-area insets; the rest used hard-coded paddingTop values that
 * collide with the status bar on notched devices.
 */
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {tokens} from '../../theme/tokens';

type ScreenProps = {
  children: React.ReactNode;
  /** Wrap content in a ScrollView. Off for screens that own their own list. */
  scroll?: boolean;
  /** Lift content above the keyboard. Use on any screen with a text input. */
  avoidKeyboard?: boolean;
  /** Apply the standard horizontal gutter. */
  gutter?: boolean;
  /** Respect the bottom inset. Off when a tab bar already covers it. */
  edgeBottom?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
};

export function Screen({
  children,
  scroll = false,
  avoidKeyboard = false,
  gutter = true,
  edgeBottom = true,
  onRefresh,
  refreshing = false,
  style,
  contentStyle,
  testID,
}: ScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const padding: ViewStyle = {
    paddingTop: insets.top,
    paddingLeft: insets.left + (gutter ? tokens.layout.gutter : 0),
    paddingRight: insets.right + (gutter ? tokens.layout.gutter : 0),
  };

  const bottomPadding = edgeBottom ? insets.bottom + tokens.spacing.xxl : 0;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        padding,
        {paddingBottom: bottomPadding},
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.color.brand}
            colors={[tokens.color.brand]}
            progressBackgroundColor={tokens.color.surface}
          />
        ) : undefined
      }>
      {children}
    </ScrollView>
  ) : (
    <View
      style={[styles.flex, padding, {paddingBottom: bottomPadding}, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.root, style]} testID={testID}>
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.canvas,
  },
  flex: {
    flex: 1,
  },
});

export default Screen;
