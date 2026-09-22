import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/colors';
import { AppButton } from './AppButton';

interface ErrorStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({ title, message, actionLabel, onAction }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <AppButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: Spacing.xl,
    alignSelf: 'stretch',
  },
});