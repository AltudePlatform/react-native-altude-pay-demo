/**
 * React Navigation theme.
 *
 * NavigationContainer previously had no theme, so it fell back to the library
 * default whose background is rgb(242,242,242). On a dark canvas that produced
 * a white flash behind every stack transition.
 */
import {DarkTheme, type Theme} from '@react-navigation/native';

import {tokens} from './tokens';

export const navigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: tokens.color.brand,
    background: tokens.color.canvas,
    card: tokens.color.canvas,
    text: tokens.color.textPrimary,
    border: tokens.color.borderHairline,
    notification: tokens.color.brand,
  },
};

export default navigationTheme;
