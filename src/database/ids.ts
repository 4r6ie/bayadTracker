import { randomUUID } from 'expo-crypto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A new row id. Random UUIDs let two offline phones create rows at the same
 * time without their ids colliding when they sync.
 */
export function newId(): string {
  return randomUUID();
}

/**
 * True for a well-formed UUID. Screens get ids from route params, so a
 * repository checks them before touching the database.
 */
export function isValidId(id: string): boolean {
  return UUID_PATTERN.test(id);
}

/** Current time as ISO text, used for created_at / updated_at / deleted_at. */
export function nowISO(): string {
  return new Date().toISOString();
}
