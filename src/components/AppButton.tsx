import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/colors';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  compact = false,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary'
      ? Colors.primary
      : variant === 'danger'
        ? Colors.danger
        : variant === 'outline'
          ? Colors.surface
          : Colors.primarySoft;

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? Colors.white
      : variant === 'outline'
        ? Colors.primary
        : Colors.primaryDark;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor: Colors.border },
        variant === 'outline' && styles.outline,
        compact && styles.compact,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }, compact && styles.compactLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: Spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 14,
  },
});