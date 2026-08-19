export const tokens = {
  colors: {
    page: '#f4f7fc',
    card: '#ffffff',
    textPrimary: '#1f2a3d',
    textMuted: '#75839a',
    accent: '#2f80ed',
    accentDark: '#1f6fd8',
    accentSoft: '#eaf2ff',
    border: '#dbe6f5',
    success: '#22a06b',
    danger: '#bf3f2a',
    tabBg: '#eef4fb',
  },
  gradient: {
    heroFrom: '#3f8cff',
    heroMid: '#4f7ef4',
    heroTo: '#6d5ce8',
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  motion: {
    fast: 180,
    base: 320,
    slow: 640,
    ascent: 1600,
  },
  // Type scale. Screens compose from these rather than declaring sizes inline.
  type: {
    display: {fontSize: 34, fontWeight: '800', letterSpacing: -0.6, lineHeight: 40},
    title: {fontSize: 24, fontWeight: '800', letterSpacing: -0.3, lineHeight: 30},
    heading: {fontSize: 17, fontWeight: '700', letterSpacing: -0.1, lineHeight: 22},
    body: {fontSize: 15, fontWeight: '500', lineHeight: 21},
    label: {fontSize: 13, fontWeight: '600', lineHeight: 18},
    caption: {fontSize: 12, fontWeight: '500', lineHeight: 16},
    eyebrow: {fontSize: 11, fontWeight: '700', letterSpacing: 1.6, lineHeight: 14},
    mono: {fontFamily: 'monospace', fontSize: 12, lineHeight: 18},
    action: {fontSize: 16, fontWeight: '800', letterSpacing: -0.1},
  },
  // 60/30/10: surfaces carry the page, ink carries the content, accent is rationed.
  onAccent: {
    primary: '#ffffff',
    secondary: 'rgba(255,255,255,0.78)',
    muted: 'rgba(255,255,255,0.6)',
  },
} as const;
