/**
 * Toast.
 *
 * The app previously used Alert.alert for everything, including confirmations
 * as trivial as "Copied". An OS modal for a passive confirmation is jarring
 * and blocks the flow. Destructive confirmations and validation that must be
 * acknowledged deliberately still use Alert.
 *
 * Announced via accessibilityLiveRegion so screen-reader users get the
 * confirmation too.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {FadeInDown, FadeOutDown} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {tokens} from '../../theme/tokens';
import {Icon, type IconName} from './Icon';

type ToastTone = 'success' | 'error' | 'info';

type ToastState = {
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue>({showToast: () => {}});

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const TONE: Record<ToastTone, {fg: string; icon: IconName}> = {
  success: {fg: tokens.color.success, icon: 'check'},
  error: {fg: tokens.color.error, icon: 'alert'},
  info: {fg: tokens.color.brand, icon: 'alert'},
};

const VISIBLE_MS = 2600;

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setToast({message, tone});
    timer.current = setTimeout(() => setToast(null), VISIBLE_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const value = useMemo(() => ({showToast}), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          style={[styles.host, {bottom: insets.bottom + tokens.spacing.huge}]}>
          <Animated.View
            entering={FadeInDown.duration(tokens.motion.fast)}
            exiting={FadeOutDown.duration(tokens.motion.fast)}
            accessibilityLiveRegion="polite"
            style={styles.toast}>
            <Icon
              name={TONE[toast.tone].icon}
              size={tokens.icon.md}
              color={TONE[toast.tone].fg}
              strokeWidth={2.25}
            />
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: tokens.layout.gutter,
    right: tokens.layout.gutter,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.color.surfaceHigh,
    borderColor: tokens.color.borderStrong,
    borderWidth: tokens.border.strong,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.lg,
    ...tokens.elevation.overlay,
  },
  message: {
    ...tokens.type.label,
    color: tokens.color.textPrimary,
    flexShrink: 1,
  },
});

export default ToastProvider;
