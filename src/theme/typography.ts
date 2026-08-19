/**
 * Typography roles.
 *
 * Font families are indirected through `fontFamily` so that bundling Manrope
 * and DM Mono is a one-line change here rather than an edit to every screen.
 * Until those faces are linked, `undefined` resolves to the platform system
 * face (Roboto on Android, SF on iOS), which is a correct, shippable fallback.
 *
 * Why not `fontFamily: 'monospace'`? It resolves to Roboto Mono on Android but
 * Courier on iOS, so numeric data rendered with it looked different on each
 * platform. `monoFamily` keeps that decision in one place.
 */
import {Platform, type TextStyle} from 'react-native';

/**
 * Set these to 'Manrope' / 'DM Mono' once the .ttf files are added to
 * android/app/src/main/assets/fonts and linked via react-native.config.js.
 *
 * Note for that change: Android resolves custom faces by file name, so pair
 * each weight with an explicit family (e.g. 'Manrope-SemiBold') rather than
 * relying on numeric fontWeight.
 */
export const fontFamily = {
  sans: undefined as string | undefined,
  mono: Platform.select({ios: 'Menlo', android: 'monospace', default: 'monospace'}),
};

const sans = (weight: TextStyle['fontWeight']): TextStyle => ({
  fontFamily: fontFamily.sans,
  fontWeight: weight,
});

/**
 * Numeric styles use the mono face because it is inherently tabular.
 * `fontVariant: ['tabular-nums']` is unreliable on Android.
 */
const mono = (weight: TextStyle['fontWeight']): TextStyle => ({
  fontFamily: fontFamily.mono,
  fontWeight: weight,
});

export const type = {
  /** Oversized primary value - the one big number on a screen. */
  displayXL: {
    ...mono('700'),
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -1.5,
  },
  /** Secondary large value, e.g. a receipt total. */
  displayLG: {
    ...mono('700'),
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
  },
  display: {
    ...sans('800'),
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  title: {
    ...sans('800'),
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  heading: {
    ...sans('700'),
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  body: {
    ...sans('500'),
    fontSize: 15,
    lineHeight: 21,
  },
  label: {
    ...sans('600'),
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    ...sans('500'),
    fontSize: 12,
    lineHeight: 16,
  },
  /** Small all-caps metadata. Restrained editorial treatment. */
  eyebrow: {
    ...sans('700'),
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
  },
  /** Addresses, signatures, payment links. */
  mono: {
    ...mono('400'),
    fontSize: 12,
    lineHeight: 18,
  },
  /** Inline numeric values in rows. */
  monoValue: {
    ...mono('600'),
    fontSize: 15,
    lineHeight: 20,
  },
  action: {
    ...sans('700'),
    fontSize: 16,
    letterSpacing: -0.1,
  },
} as const;

export type TypeScale = typeof type;
