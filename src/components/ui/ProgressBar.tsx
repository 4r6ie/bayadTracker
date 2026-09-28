import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface ProgressBarProps {
  /** 0..1; values outside are clamped. */
  fraction: number;
  tone?: 'accent' | 'warning' | 'hero';
  height?: number;
}

export function ProgressBar({ fraction, tone = 'accent', height = 6 }: ProgressBarProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const clamped = Number.isFinite(fraction) ? Math.max(0, Math.min(fraction, 1)) : 0;
  const [track, fill] =
    tone === 'hero'
      ? [c.heroTrack, c.heroFill]
      : [c.surfaceMuted, tone === 'warning' ? c.warning : c.accent];
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: track,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: `${clamped * 100}%`, height: '100%', backgroundColor: fill }} />
    </View>
  );
}
