import { Pressable } from 'react-native';
import { syncNow, useSyncStatus, type SyncStatus } from '../sync/syncManager';
import { Pill, type PillTone } from './ui/Pill';

function describe(status: SyncStatus): {
  text: string;
  tone: PillTone;
  icon: 'cloud-done-outline' | 'sync-outline' | 'cloud-offline-outline' | 'alert-circle-outline' | 'cloud-upload-outline';
} {
  const waiting = status.pending > 0 ? ` · ${status.pending} waiting` : '';
  switch (status.state) {
    case 'syncing':
      return { text: 'Syncing', tone: 'accent', icon: 'sync-outline' };
    case 'offline':
      return { text: `Offline${waiting}`, tone: 'warning', icon: 'cloud-offline-outline' };
    case 'error':
      return { text: `Sync failed${waiting}`, tone: 'danger', icon: 'alert-circle-outline' };
    default:
      return status.lastSyncedAt && status.pending === 0
        ? { text: 'Synced', tone: 'accent', icon: 'cloud-done-outline' }
        : { text: `Not synced${waiting}`, tone: 'warning', icon: 'cloud-upload-outline' };
  }
}

/**
 * A small pill telling the mayor / secretary whether their records reached
 * the other phone. Tapping it syncs right away.
 */
export function SyncStatusBar() {
  const status = useSyncStatus();
  if (status.state === 'disabled') {
    // Local-only build (no Supabase configured): nothing to report.
    return null;
  }
  const { text, tone, icon } = describe(status);
  return (
    <Pressable
      onPress={() => syncNow()}
      accessibilityRole="button"
      accessibilityLabel={`${text}. Sync now.`}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Pill label={text} tone={tone} icon={icon} />
    </Pressable>
  );
}
