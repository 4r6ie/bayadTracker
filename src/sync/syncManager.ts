import * as Network from 'expo-network';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { notifyRemoteChange, onLocalChange } from './events';
import { countPendingChanges, runSync } from './syncEngine';

/**
 * Decides when to sync and keeps a status the screens can show.
 *
 * Syncs run when the app starts, when the phone comes back online, when the
 * app returns to the foreground, a moment after any local change, and every
 * few minutes while the app is open. Only one sync runs at a time; a request
 * made during a sync runs once more right after it.
 */

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error' | 'disabled';

export interface SyncStatus {
  state: SyncState;
  /** Local changes not uploaded yet. */
  pending: number;
  lastSyncedAt: string | null;
  error: string | null;
}

const LOCAL_CHANGE_DELAY_MS = 2_000;
const PERIODIC_SYNC_MS = 3 * 60_000;

let status: SyncStatus = {
  state: supabase ? 'idle' : 'disabled',
  pending: 0,
  lastSyncedAt: null,
  error: null,
};
const statusListeners = new Set<() => void>();

function setStatus(next: Partial<SyncStatus>): void {
  status = { ...status, ...next };
  for (const listener of statusListeners) {
    listener();
  }
}

function subscribeStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** The current sync status, re-rendering when it changes. */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeStatus, () => status);
}

async function refreshPending(): Promise<void> {
  try {
    setStatus({ pending: await countPendingChanges() });
  } catch {
    // The count is only informational.
  }
}

async function isOnline(): Promise<boolean> {
  try {
    const network = await Network.getNetworkStateAsync();
    return network.isConnected === true && network.isInternetReachable !== false;
  } catch {
    return false;
  }
}

async function syncOnce(): Promise<void> {
  if (!supabase) {
    setStatus({ state: 'disabled' });
    return;
  }
  if (!(await isOnline())) {
    setStatus({ state: 'offline' });
    await refreshPending();
    return;
  }
  // getSession refreshes an expired access token when it can.
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    setStatus({ state: 'error', error: 'Sign in again to sync.' });
    await refreshPending();
    return;
  }
  setStatus({ state: 'syncing', error: null });
  try {
    const result = await runSync(supabase);
    if (result.pulled > 0) {
      notifyRemoteChange();
    }
    setStatus({ state: 'idle', lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    if (__DEV__) {
      console.error('Sync failed', error);
    }
    const online = await isOnline();
    setStatus({
      state: online ? 'error' : 'offline',
      error: error instanceof Error ? error.message : 'Sync failed.',
    });
  } finally {
    await refreshPending();
  }
}

let running: Promise<void> | null = null;
let runAgain = false;

/** Syncs now, or right after the sync already in progress. */
export function syncNow(): Promise<void> {
  if (running) {
    runAgain = true;
    return running;
  }
  running = (async () => {
    do {
      runAgain = false;
      await syncOnce();
    } while (runAgain);
  })().finally(() => {
    running = null;
  });
  return running;
}

/**
 * Starts automatic syncing. Call once while signed in; returns a function
 * that stops it (used on sign-out).
 */
export function startAutoSync(): () => void {
  let localChangeTimer: ReturnType<typeof setTimeout> | null = null;

  const stopLocal = onLocalChange(() => {
    // Batch a burst of edits (e.g. several payments) into one upload.
    if (localChangeTimer) {
      clearTimeout(localChangeTimer);
    }
    localChangeTimer = setTimeout(() => {
      localChangeTimer = null;
      syncNow();
    }, LOCAL_CHANGE_DELAY_MS);
    refreshPending();
  });

  const networkSubscription = Network.addNetworkStateListener((network) => {
    if (network.isConnected && network.isInternetReachable !== false) {
      syncNow();
    }
  });

  const appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      syncNow();
    }
  });

  const interval = setInterval(() => {
    if (AppState.currentState === 'active') {
      syncNow();
    }
  }, PERIODIC_SYNC_MS);

  syncNow();

  return () => {
    stopLocal();
    networkSubscription.remove();
    appStateSubscription.remove();
    clearInterval(interval);
    if (localChangeTimer) {
      clearTimeout(localChangeTimer);
    }
  };
}
