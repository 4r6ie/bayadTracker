import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { font, radius, space, TOUCH } from '../../theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** primary = the one main action on a screen. */
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  /** Shows `busyLabel` and ignores presses while an action runs. */
  busy?: boolean;
  busyLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  busy = false,
  busyLabel,
  style,
}: ButtonProps) {
  const styles = useStyles();
  const { theme } = useTheme();
  const color =
    variant === 'primary'
      ? theme.colors.onAccent
      : variant === 'danger'
        ? theme.colors.danger
        : theme.colors.accentText;

  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || busy) && styles.dimmed,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
      <Text style={[styles.label, { color }]}>{busy && busyLabel ? busyLabel : label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    minHeight: TOUCH + 6,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
  },
  primary: {
    backgroundColor: t.colors.accent,
  },
  secondary: {
    backgroundColor: t.colors.accentTint,
  },
  danger: {
    backgroundColor: t.colors.dangerTint,
  },
  dimmed: {
    opacity: 0.6,
  },
  label: {
    fontSize: font.body,
    fontWeight: '700',
  },
}));
