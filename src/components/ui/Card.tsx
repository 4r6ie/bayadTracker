import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { radius, space } from '../../theme/tokens';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Set false for cards holding a list of rows that pad themselves. */
  padded?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/** The white rounded surface everything sits on. Pressable when given onPress. */
export function Card({
  children,
  style,
  padded = true,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const styles = useStyles();
  if (!onPress && !onLongPress) {
    return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.card,
        padded && styles.padded,
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: radius.lg,
    marginBottom: space.sm,
    shadowColor: t.colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  padded: {
    padding: space.md + 2,
  },
  pressed: {
    opacity: 0.75,
  },
}));
