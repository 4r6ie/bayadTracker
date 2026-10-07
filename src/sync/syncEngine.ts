import type { SupabaseClient } from '@supabase/supabase-js';
import { getDatabase } from '../database/database';

/**
 * Two-way sync between the phone's SQLite and Supabase Postgres.
 *
 * - push: upload every local row with `synced = 0`, then mark it synced.
 * - pull: download every server row changed since the last pull, by the
 *   server-assigned `server_updated_at`, and write it locally.
 *
 * Conflicts: the server keeps whichever version has the newer `updated_at`
 * (see the trigger in `supabase/schema.sql`), so the latest edit wins.
 */

type SyncTable = 'students' | 'amotan' | 'amotan_payments';

/** Parents before children: uploads and local writes follow this order. */
const TABLES: readonly SyncTable[] = ['students', 'amotan', 'amotan_payments'];

/**
 * Columns shared by the phone and the server. Table and column names are
 * constants, never user input, so building SQL from them is safe; every
 * value is still bound with `?`.
 */
const COLUMNS: Record<SyncTable, readonly string[]> = {
  students: ['id', 'name', 'created_at', 'updated_at', 'deleted_at'],
  amotan: [
    'id',
    'title',
    'amount_cents',
    'due_date',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  amotan_payments: [
    'id',
    'student_id',
    'amotan_id',
    'amount_cents',
    'paid_date',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
};

const UPLOAD_BATCH = 500;
const PAGE_SIZE = 1000;

/**
 * Pulls re-read the last minute before the cursor. A server write that
 * started earlier but committed later than one we already saw would
 * otherwise be skipped. Re-applying a row is harmless.
 */
const PULL_OVERLAP_MS = 60_000;

type Row = Record<string, unknown>;
type SQLiteValue = string | number | null;

function toSQLiteValue(value: unknown): SQLiteValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  return String(value);
}

async function pushTable(client: SupabaseClient, table: SyncTable): Promise<number> {
  const db = await getDatabase();
  const columns = COLUMNS[table];
  const rows = await db.getAllAsync<Row>(
    `SELECT ${columns.join(', ')} FROM ${table} WHERE synced = 0`
  );
  for (let start = 0; start < rows.length; start += UPLOAD_BATCH) {
    const batch = rows.slice(start, start + UPLOAD_BATCH);
    const { error } = await client.from(table).upsert(batch);
    if (error) {
      throw new Error(`Upload to ${table} failed: ${error.message}`);
    }
    await db.withTransactionAsync(async () => {
      for (const row of batch) {
        // Only if unchanged since it was read: an edit made while this
        // upload was in flight must stay pending for the next sync.
        await db.runAsync(
          `UPDATE ${table} SET synced = 1 WHERE id = ? AND updated_at = ?`,
          [toSQLiteValue(row.id), toSQLiteValue(row.updated_at)]
        );
      }
    });
  }
  return rows.length;
}

async function getCursor(table: SyncTable): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ last_pulled_at: string | null }>(
    'SELECT last_pulled_at FROM sync_state WHERE table_name = ?',
    [table]
  );
  return row?.last_pulled_at ?? null;
}

/**
 * The cursor minus the overlap window, or null (= pull everything) when the
 * cursor cannot be read. Postgres sends microseconds (`.456789`), which some
 * JS engines refuse to parse, so the fraction is cut to milliseconds first.
 */
function pullSince(cursor: string | null): string | null {
  if (cursor === null) {
    return null;
  }
  const ms = Date.parse(cursor.replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(ms)) {
    return null;
  }
  return new Date(ms - PULL_OVERLAP_MS).toISOString();
}

async function fetchChanges(
  client: SupabaseClient,
  table: SyncTable,
  cursor: string | null
): Promise<Row[]> {
  const since = pullSince(cursor);
  const select = [...COLUMNS[table], 'server_updated_at'].join(',');
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client.from(table).select(select);
    if (since !== null) {
      query = query.gt('server_updated_at', since);
    }
    const { data, error } = await query
      .order('server_updated_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Download from ${table} failed: ${error.message}`);
    }
    const page = (data ?? []) as unknown as Row[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}

/** Returns how many rows were downloaded. */
async function pullAll(client: SupabaseClient): Promise<number> {
  // Fetch children first, then parents. The other phone uploads parents
  // before children, so every parent a fetched payment points to was already
  // on the server when the parents were fetched: nothing arrives orphaned.
  const fetched = {} as Record<SyncTable, Row[]>;
  for (const table of [...TABLES].reverse()) {
    fetched[table] = await fetchChanges(client, table, await getCursor(table));
  }

  const db = await getDatabase();
  let count = 0;
  await db.withTransactionAsync(async () => {
    // Apply parents first so the local foreign keys are satisfied.
    for (const table of TABLES) {
      const rows = fetched[table];
      if (rows.length === 0) {
        continue;
      }
      const columns = COLUMNS[table];
      const placeholders = columns.map(() => '?').join(', ');
      const assignments = columns
        .filter((column) => column !== 'id')
        .map((column) => `${column} = excluded.${column}`)
        .join(', ');
      for (const row of rows) {
        // `WHERE synced = 1` skips rows edited here and not uploaded yet:
        // the local edit uploads next time and the server decides who wins.
        await db.runAsync(
          `INSERT INTO ${table} (${columns.join(', ')}, synced)
           VALUES (${placeholders}, 1)
           ON CONFLICT (id) DO UPDATE SET ${assignments}, synced = 1
           WHERE ${table}.synced = 1`,
          columns.map((column) => toSQLiteValue(row[column]))
        );
      }
      const newest = String(rows[rows.length - 1].server_updated_at);
      await db.runAsync(
        `INSERT INTO sync_state (table_name, last_pulled_at)
         VALUES (?, ?)
         ON CONFLICT (table_name) DO UPDATE SET last_pulled_at =
           MAX(COALESCE(sync_state.last_pulled_at, ''), excluded.last_pulled_at)`,
        [table, newest]
      );
      count += rows.length;
    }
  });
  return count;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

/** One full sync: upload local changes first, then download the rest. */
export async function runSync(client: SupabaseClient): Promise<SyncResult> {
  let pushed = 0;
  for (const table of TABLES) {
    pushed += await pushTable(client, table);
  }
  const pulled = await pullAll(client);
  return { pushed, pulled };
}

/** Local rows that still have to be uploaded. */
export async function countPendingChanges(): Promise<number> {
  const db = await getDatabase();
  let total = 0;
  for (const table of TABLES) {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM ${table} WHERE synced = 0`
    );
    total += Number(row?.count ?? 0);
  }
  return total;
}
