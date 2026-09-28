// The SQLite-backed `localStorage` global. Also installed by lib/supabase;
// importing it here too keeps the theme working without Supabase.
import 'expo-sqlite/localStorage/install';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet } from 'react-native';
import {
  ACCENTS,
  buildTheme,
  STYLES,
  type AccentName,
  type StyleName,
  type Theme,
} from './palettes';

const STYLE_KEY = 'bayadtracker.themeStyle';
const ACCENT_KEY = 'bayadtracker.themeAccent';

const DEFAULT_STYLE: StyleName = 'soft';
const DEFAULT_ACCENT: AccentName = 'green';

function read<T extends string>(key: string, allowed: Record<T, unknown>, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value !== null && value in allowed ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Only a preference: worst case it resets next launch.
  }
}

interface ThemeContextValue {
  theme: Theme;
  setStyle: (style: StyleName) => void;
  setAccent: (accent: AccentName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Holds the chosen style and accent. They are saved on this phone only (the
 * mayor and the secretary can each pick their own) and read synchronously at
 * launch, so the app never flashes the default colors first.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [style, setStyleState] = useState<StyleName>(() =>
    read(STYLE_KEY, STYLES, DEFAULT_STYLE)
  );
  const [accent, setAccentState] = useState<AccentName>(() =>
    read(ACCENT_KEY, ACCENTS, DEFAULT_ACCENT)
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: buildTheme(style, accent),
      setStyle(next) {
        write(STYLE_KEY, next);
        setStyleState(next);
      },
      setAccent(next) {
        write(ACCENT_KEY, next);
        setAccentState(next);
      },
    }),
    [style, accent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return value;
}

/**
 * Themed StyleSheets. Define styles once as a function of the theme; the
 * returned hook rebuilds them only when the theme changes.
 *
 *   const useStyles = makeStyles((t) => ({ card: { backgroundColor: t.colors.surface } }));
 *   const styles = useStyles();
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T
): () => T {
  return function useStyles(): T {
    const { theme } = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
