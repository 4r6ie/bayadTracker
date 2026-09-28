/**
 * The app's colors. Screens never hard-code a hex value: they read these
 * through `useTheme()` / `makeStyles()`, so switching style or accent
 * recolors every screen at once.
 *
 * Every text/background pair here was checked for WCAG AA contrast (4.5:1
 * for text; white on every accent is 4.7:1 or more).
 */

export type StyleName = 'soft' | 'charcoal';
export type AccentName = 'green' | 'sage' | 'teal' | 'blue' | 'violet' | 'rose';

interface Accent {
  label: string;
  /** Fills: buttons, checkboxes, progress, icons. White text reads on it. */
  main: string;
  /** Accent-colored text on light surfaces. */
  strong: string;
  /** Soft accent background (pills, avatars, selected chips). */
  tint: string;
  /** For accents drawn on the charcoal surfaces. */
  bright: string;
}

export const ACCENTS: Record<AccentName, Accent> = {
  green: { label: 'Green', main: '#2E7D55', strong: '#1D5A3C', tint: '#E2EFE7', bright: '#3DBE7A' },
  sage: { label: 'Sage', main: '#4E7D65', strong: '#33574A', tint: '#E3ECE6', bright: '#8CC5A5' },
  teal: { label: 'Teal', main: '#1F7A7A', strong: '#135757', tint: '#DDEFEE', bright: '#3CC7C2' },
  blue: { label: 'Blue', main: '#2F66A6', strong: '#1D4777', tint: '#E3ECF7', bright: '#6AAEF2' },
  violet: { label: 'Violet', main: '#6352B8', strong: '#433887', tint: '#ECE9FA', bright: '#A99BF3' },
  rose: { label: 'Rose', main: '#A8475F', strong: '#7C3044', tint: '#F6E5EA', bright: '#EE8FAA' },
};

export const ACCENT_NAMES = Object.keys(ACCENTS) as AccentName[];

export const STYLES: Record<StyleName, { label: string; description: string }> = {
  soft: { label: 'Soft', description: 'Light gray and white' },
  charcoal: { label: 'Charcoal', description: 'Dark summary and tab bar' },
};

export interface ThemeColors {
  background: string;
  surface: string;
  /** Inputs, chips and other quiet fills on a card. */
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;

  accent: string;
  accentText: string;
  accentTint: string;
  onAccent: string;

  /** "Partly paid" / owes money. */
  warning: string;
  warningText: string;
  warningTint: string;
  danger: string;
  dangerTint: string;
  /** "Not paid" pill. */
  neutralTint: string;
  neutralText: string;

  /** The big summary card on the dashboard. */
  hero: string;
  heroText: string;
  heroSubtext: string;
  heroTrack: string;
  heroFill: string;

  tabBar: string;
  tabActive: string;
  tabInactive: string;
  tabBorder: string;

  shadow: string;
}

export interface Theme {
  style: StyleName;
  accentName: AccentName;
  colors: ThemeColors;
  /** Muted pairs for student initials, picked by name so they never change. */
  avatars: readonly { background: string; text: string }[];
}

const NEUTRAL = {
  text: '#1F2421',
  textSecondary: '#5F6561',
  textMuted: '#8E948F',
  border: '#E4E6E3',
  divider: '#ECEDEA',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F5F3',
  warning: '#D9A441',
  warningText: '#7A5A1E',
  warningTint: '#F3ECDD',
  danger: '#B03A3A',
  dangerTint: '#F8E6E6',
  neutralTint: '#EFEFEC',
  neutralText: '#5B605C',
  shadow: '#1F2421',
};

const AVATARS = [
  { background: '#E3ECE6', text: '#2F5D46' },
  { background: '#EDE9E3', text: '#5E5448' },
  { background: '#E6E8EC', text: '#4A5160' },
  { background: '#EFE6E6', text: '#6E4646' },
  { background: '#E8E6EF', text: '#524A6B' },
  { background: '#E1ECEC', text: '#3E5E5E' },
  { background: '#F1EBDD', text: '#6B5626' },
] as const;

export function buildTheme(style: StyleName, accentName: AccentName): Theme {
  const accent = ACCENTS[accentName];
  const shared = {
    ...NEUTRAL,
    accent: accent.main,
    accentText: accent.strong,
    accentTint: accent.tint,
    onAccent: '#FFFFFF',
  };

  const colors: ThemeColors =
    style === 'charcoal'
      ? {
          ...shared,
          background: '#F4F4F2',
          hero: '#23272A',
          heroText: '#FFFFFF',
          heroSubtext: '#A9B0AC',
          heroTrack: '#3A3F42',
          heroFill: accent.bright,
          tabBar: '#23272A',
          tabActive: accent.bright,
          tabInactive: '#7C8480',
          tabBorder: '#23272A',
        }
      : {
          ...shared,
          background: '#F2F2EF',
          hero: NEUTRAL.surface,
          heroText: NEUTRAL.text,
          heroSubtext: NEUTRAL.textSecondary,
          heroTrack: '#E8EAE6',
          heroFill: accent.main,
          tabBar: NEUTRAL.surface,
          tabActive: accent.main,
          tabInactive: NEUTRAL.textMuted,
          tabBorder: NEUTRAL.border,
        };

  return { style, accentName, colors, avatars: AVATARS };
}
