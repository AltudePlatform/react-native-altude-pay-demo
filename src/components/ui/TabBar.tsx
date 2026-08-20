/**
 * Bottom tab bar.
 *
 * Replaces tab "icons" that were <View> shapes drawn with borderWidth, and a
 * fixed 66pt height that ignored the gesture inset on devices with a home
 * indicator. One tab is emphasized as the primary action.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {tokens} from '../../theme/tokens';
import {Icon, type IconName} from './Icon';

const ICONS: Record<string, IconName> = {
  Home: 'home',
  Send: 'send',
};

/** The single emphasized action in the bar. */
const PRIMARY_ROUTE = 'Send';

export function TabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {paddingBottom: insets.bottom + tokens.spacing.md},
      ]}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ?? route.name);
        const focused = state.index === index;
        const primary = route.name === PRIMARY_ROUTE;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const tint = primary
          ? tokens.color.textPrimary
          : focused
            ? tokens.color.brand
            : tokens.color.textMuted;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{selected: focused}}
            accessibilityLabel={label}
            style={styles.tab}>
            {({pressed}) => (
              <>
                <View
                  style={[
                    styles.iconWrap,
                    primary && styles.iconWrapPrimary,
                    primary && focused && styles.iconWrapPrimaryActive,
                    pressed && styles.pressed,
                  ]}>
                  <Icon
                    name={ICONS[route.name] ?? 'home'}
                    size={tokens.icon.lg}
                    color={tint}
                    strokeWidth={focused ? 2.1 : 1.75}
                  />
                </View>
                <Text
                  style={[
                    styles.label,
                    {color: focused ? tokens.color.textPrimary : tokens.color.textMuted},
                  ]}>
                  {label}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: tokens.color.canvas,
    borderTopWidth: tokens.border.strong,
    borderTopColor: tokens.color.borderHairline,
    paddingTop: tokens.spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xs,
    minHeight: tokens.layout.touchTarget,
  },
  iconWrap: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.pill,
  },
  iconWrapPrimary: {
    backgroundColor: tokens.color.brandSurface,
  },
  iconWrapPrimaryActive: {
    backgroundColor: tokens.color.brand,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...tokens.type.caption,
    fontWeight: '600',
  },
});

export default TabBar;
