/**
 * Sizes shared by every screen. Using these names instead of raw numbers
 * keeps spacing and type consistent from one screen to the next.
 */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const font = {
  caption: 12,
  footnote: 13,
  body: 15,
  callout: 16,
  subtitle: 17,
  title: 22,
  largeTitle: 30,
  hero: 34,
} as const;

/** Minimum touch target, per the iOS and Android guidelines. */
export const TOUCH = 44;
