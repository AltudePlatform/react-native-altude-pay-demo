/**
 * Design-token contrast tests.
 *
 * The previous palette failed WCAG AA on its two most-used foregrounds:
 * textMuted measured 3.58:1 on the page and the accent measured 3.87:1 on
 * white, yet between them they carried nearly all secondary copy and every
 * text link in the app.
 *
 * These tests keep that from regressing, and they document why the dark-mode
 * error colour had to be derived rather than taken from the marketing palette.
 */
import {tokens} from '../src/theme/tokens';

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5]
    .map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4),
    );

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const AA_NORMAL = 4.5;
const AA_LARGE = 3;

describe('colour tokens on the ink canvas', () => {
  const canvas = tokens.color.canvas;

  it.each([
    ['textPrimary', tokens.color.textPrimary],
    ['textSecondary', tokens.color.textSecondary],
    ['textMuted', tokens.color.textMuted],
    ['brand', tokens.color.brand],
    ['success', tokens.color.success],
    ['warning', tokens.color.warning],
    ['error', tokens.color.error],
  ])('%s meets AA for normal text', (_name, color) => {
    expect(contrast(color, canvas)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('keeps every foreground readable on the elevated surface too', () => {
    const surfaces = [tokens.color.surface, tokens.color.surfaceElevated];
    const foregrounds = [
      tokens.color.textPrimary,
      tokens.color.textSecondary,
      tokens.color.textMuted,
      tokens.color.brand,
    ];

    for (const surface of surfaces) {
      for (const foreground of foregrounds) {
        expect(contrast(foreground, surface)).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    }
  });

  it('gives the primary button fill readable text', () => {
    expect(
      contrast(tokens.color.textPrimary, tokens.color.brandSurface),
    ).toBeGreaterThanOrEqual(AA_LARGE);
  });

  it('does not use the marketing red as a dark-mode foreground', () => {
    // Altude marketing red is #A6262D. On ink it measures ~2.51:1.
    expect(contrast('#A6262D', canvas)).toBeLessThan(AA_NORMAL);
    expect(tokens.color.error.toLowerCase()).not.toBe('#a6262d');
  });

  it('keeps borders distinguishable from the canvas', () => {
    // Non-text contrast only needs to be perceptible, not AA.
    expect(contrast(tokens.color.borderStrong, canvas)).toBeGreaterThan(1.5);
  });

  it('never falls back to the old failing values', () => {
    const retired = ['#75839a', '#2f80ed', '#f4f7fc', '#22a06b'];
    const serialized = JSON.stringify(tokens.color).toLowerCase();

    for (const value of retired) {
      expect(serialized).not.toContain(value);
    }
  });
});

describe('layout tokens', () => {
  it('defines an accessible minimum touch target', () => {
    expect(tokens.layout.touchTarget).toBeGreaterThanOrEqual(44);
  });
});
