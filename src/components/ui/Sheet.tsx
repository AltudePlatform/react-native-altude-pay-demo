/**
 * Bottom sheet.
 *
 * Replaces the bare Modal + backdrop used for the onboarding country picker.
 * Built on React Native's Modal because react-native-screens is shimmed to
 * plain Views in metro.config.js, so native sheet presentation is unavailable.
 */
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {tokens} from '../../theme/tokens';
import {Icon} from './Icon';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Sheet({
  visible,
  onClose,
  title,
  children,
  style,
}: SheetProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />

        <View
          style={[
            styles.sheet,
            {paddingBottom: insets.bottom + tokens.spacing.xl},
            style,
          ]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              style={({pressed}) => [styles.close, pressed && styles.pressed]}>
              <Icon
                name="close"
                size={tokens.icon.lg}
                color={tokens.color.textSecondary}
              />
            </Pressable>
          </View>

          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.color.scrim.modal,
  },
  sheet: {
    backgroundColor: tokens.color.surfaceHigh,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    borderTopWidth: tokens.border.strong,
    borderColor: tokens.color.borderStrong,
    paddingHorizontal: tokens.layout.gutter,
    paddingTop: tokens.spacing.md,
    maxHeight: '80%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.borderStrong,
    marginBottom: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
  },
  title: {
    ...tokens.type.heading,
    color: tokens.color.textPrimary,
  },
  close: {
    width: tokens.layout.touchTarget,
    height: tokens.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -tokens.spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default Sheet;
