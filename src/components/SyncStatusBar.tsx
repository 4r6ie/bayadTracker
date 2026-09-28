import { Pressable, StyleSheet, Text } from 'react-native';
import { syncNow, useSyncStatus, type SyncStatus } from '../sync/syncManager';

function describe(status: SyncStatus): { text: string; tone: 'ok' | 'warn' | 'error' } {
  const waiting =
    status.pending > 0
      ? ` · ${status.pending} ${status.pending === 1 ? 'change' : 'changes'} waiting`
      : '';
  switch (status.state) {
    case 'syncing':
      return { text: 'Syncing…', tone: 'ok' };
    case 'offline':
      return { text: `Offline${waiting}`, tone: 'warn' };
    case 'error':
      return { text: `Sync failed · tap to retry${waiting}`, tone: 'error' };
    case 'disabled':
      return { text: 'Saved on this phone only', tone: 'warn' };
    default:
      return status.lastSyncedAt
        ? { text: `Synced${waiting}`, tone: 'ok' }
        : { text: `Not synced yet${waiting}`, tone: 'warn' };
  }
}

/**
 * One line telling the mayor / secretary whether their records reached the
 * other phone. Tapping it syncs right away.
 */
export function SyncStatusBar() {
  const status = useSyncStatus();
  if (status.state === 'disabled') {
    // Local-only build (no Supabase configured): nothing to report.
    return null;
  }
  const { text, tone } = describe(status);
  return (
    <Pressable
      onPress={() => syncNow()}
      accessibilityRole="button"
      accessibilityLabel={`${text}. Tap to sync now.`}
      style={({ pressed }) => [
        styles.bar,
        tone === 'warn' && styles.warn,
        tone === 'error' && styles.error,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.text,
          tone === 'warn' && styles.warnText,
          tone === 'error' && styles.errorText,
        ]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2EB',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  warn: {
    backgroundColor: '#FFF4DB',
  },
  error: {
    backgroundColor: '#FBE4E4',
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#127A52',
  },
  warnText: {
    color: '#8A5A00',
  },
  errorText: {
    color: '#C63B3B',
  },
});
