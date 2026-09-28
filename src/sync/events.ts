/**
 * Tiny pub/sub between the database layer, the sync engine and the screens.
 *
 * - "local change": a repository wrote something on this phone, so there is
 *   now something to upload.
 * - "remote change": a sync pulled rows from the server, so any screen that is
 *   open should reload what it shows.
 */
type Listener = () => void;

const localChangeListeners = new Set<Listener>();
const remoteChangeListeners = new Set<Listener>();

function emit(listeners: Set<Listener>): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      // One broken listener must not stop the others.
      if (__DEV__) {
        console.error('Sync event listener failed', error);
      }
    }
  }
}

function subscribe(listeners: Set<Listener>, listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyLocalChange(): void {
  emit(localChangeListeners);
}

/** Returns an unsubscribe function. */
export function onLocalChange(listener: Listener): () => void {
  return subscribe(localChangeListeners, listener);
}

export function notifyRemoteChange(): void {
  emit(remoteChangeListeners);
}

/** Returns an unsubscribe function. */
export function onRemoteChange(listener: Listener): () => void {
  return subscribe(remoteChangeListeners, listener);
}
