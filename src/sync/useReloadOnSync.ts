import { useEffect } from 'react';
import { onRemoteChange } from './events';

/**
 * Calls `reload` whenever a sync brings in rows from the other phone, so an
 * open list updates without the user pulling to refresh.
 * `reload` should be stable (wrapped in useCallback).
 */
export function useReloadOnSync(reload: () => void): void {
  useEffect(() => onRemoteChange(reload), [reload]);
}
