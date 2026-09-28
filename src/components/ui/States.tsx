import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { font, radius, space } from '../../theme/tokens';
import { Button } from './Button';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** A friendly empty list: icon, what the space is for, and what to do. */
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  const styles = useStyles();
  const { theme } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={theme.colors.accentText} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function LoadingState() {
  const styles = useStyles();
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const styles = useStyles();
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.textMuted} />
      <Text style={styles.errorTitle}>{message}</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
    backgroundColor: t.colors.background,
  },
  errorTitle: {
    fontSize: font.subtitle,
    fontWeight: '700',
    color: t.colors.text,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: space.xxl,
    paddingHorizontal: space.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: t.colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyTitle: {
    fontSize: font.subtitle,
    fontWeight: '700',
    color: t.colors.text,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: font.body,
    color: t.colors.textSecondary,
    textAlign: 'center',
    marginTop: space.xs,
    lineHeight: 21,
  },
  emptyAction: {
    marginTop: space.lg,
    alignSelf: 'stretch',
  },
}));
