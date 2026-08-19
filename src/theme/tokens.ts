/**
 * Altude "ink and altitude" design tokens.
 *
 * A near-black Altude-ink canvas, warm ivory type, one rationed cyan accent,
 * and depth built from tonal surface steps plus hairline borders rather than
 * gradients, glow, or a border around every element.
 *
 * Every foreground below is annotated with its measured WCAG contrast ratio
 * against the ink canvas. Do not add a colour here without measuring it.
 */
import {Platform, StyleSheet} from 'react-native';

import {fontFamily, type as typeScale} from './typography';

const palette = {
  // Surfaces sit deliberately close together; separation comes from borders.
  canvas: '#071922', // Altude ink, the canonical brand anchor
  surface: '#0E262F', // 1.14:1 - cards, inputs, sheets
  surfaceElevated: '#132E38', // 1.26:1 - pressed/selected, tab bar
  surfaceHigh: '#1B3A45', // 1.48:1 - toasts, modals

  borderHairline: '#17323C', // 1.33:1 - dividers, resting input
  borderStrong: '#24454F', // 1.74:1 - emphasis, focus track

  textPrimary: '#F2EFE9', // 15.62:1 - warm ivory, not stark white
  textSecondary: '#9BB0BA', // 7.95:1 - supporting copy
  textMuted: '#8FA3AD', // 6.84:1 - metadata

  // Cyan stays Altude's brand accent; green is reserved for success only.
  brand: '#3DBFF2', // 8.48:1 - links, focus rings, active nav
  brandSurface: '#048ABF', // 4.60:1 - filled primary button
  onBrand: '#041219',

  success: '#87CA9D', // 9.36:1
  warning: '#E8B96B', // 9.89:1
  /**
   * Derived, not canonical: the marketing red #A6262D measures 2.51:1 on ink
   * and is unusable as a dark-mode foreground.
   */
  error: '#E0666D', // 5.37:1

  disabledSurface: '#132E38',
  disabledText: '#5B7079', // non-text/decorative only
} as const;

/** Low-alpha status tints, composited over canvas or surface. */
const tint = {
  brand: 'rgba(61, 191, 242, 0.12)',
  success: 'rgba(135, 202, 157, 0.12)',
  warning: 'rgba(232, 185, 107, 0.12)',
  error: 'rgba(224, 102, 109, 0.12)',
  /** Pressed state for the destructive button. */
  errorPressed: 'rgba(224, 102, 109, 0.2)',
} as const;

/** Overlay scrims. */
const scrim = {
  /** Behind modals and sheets. */
  modal: 'rgba(4, 12, 16, 0.72)',
  /** Over a live camera preview - light enough to keep the feed legible. */
  camera: 'rgba(7, 25, 34, 0.45)',
} as const;

/**
 * QR codes must stay high-contrast black on white for scanners to read them,
 * so they are deliberately exempt from the dark palette.
 */
const qr = {
  module: '#000000',
  background: '#ffffff',
} as const;

export const tokens = {
  color: {...palette, tint, scrim, qr},

  /**
   * Retained for the two immersive screens (Preparing, PaymentStatus) only.
   * Transactional screens use flat surfaces.
   */
  gradient: {
    heroFrom: '#071922',
    heroMid: '#0B2B33',
    heroTo: '#123F43',
  },

  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    xl: 28,
    pill: 999,
  },

  /**
   * Extended so the literals already in the codebase (14/18/20/26/28) have a
   * legal neighbour to snap to instead of persisting as one-off values.
   */
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 6,
    md: 10,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
    giant: 56,
  },

  layout: {
    gutter: 20,
    section: 24,
    /** Minimum accessible touch target. */
    touchTarget: 44,
  },

  border: {
    hairline: StyleSheet.hairlineWidth,
    strong: 1,
  },

  elevation: {
    flat: {},
    raised: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 4,
    },
    overlay: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 16},
      shadowOpacity: 0.4,
      shadowRadius: 28,
      elevation: 12,
    },
  },

  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    action: 28,
  },

  motion: {
    fast: 180,
    base: 320,
    slow: 640,
    ascent: 1600,
    /** Reduced-motion safe duration. */
    none: 0,
  },

  type: typeScale,
  fontFamily,

  /** Platform hint kept local so screens don't import Platform for styling. */
  isIOS: Platform.OS === 'ios',
} as const;

export type Tokens = typeof tokens;
