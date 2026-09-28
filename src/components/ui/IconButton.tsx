import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { TOUCH } from '../../theme/tokens';

interface IconButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Required: an icon alone says nothing to a screen reader. */
  accessibilityLabel: string;
  onPress: () => void;
  tone?: 'accent' | 'danger';
}

/** An icon-only button, used for header actions (edit, share, delete). */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  tone = 'accent',
}: IconButtonProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => ({
        minWidth: TOUCH - 8,
        minHeight: TOUCH - 8,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <Ionicons
        name={icon}
        size={22}
        color={tone === 'danger' ? theme.colors.danger : theme.colors.accentText}
      />
    </Pressable>
  );
}
