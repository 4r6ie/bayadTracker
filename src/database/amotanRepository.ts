import { notifyLocalChange } from '../sync/events';
import type { Amotan, AmotanInput } from '../types/amotan';
import { getDatabase } from './database';
import { isValidId, newId, nowISO } from './ids';

/**
 * The only place SQL for `amotan` is allowed. Same rules as the student
 * repository: `?` binding, soft deletes, and `synced = 0` on every write.
 */

interface AmotanRow {
  id: string;
  title: string;
  amount_cents: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

function toAmotan(row: AmotanRow): Amotan {
  return {
    id: String(row.id),
    title: String(row.title),
    amountCents: Number(row.amount_cents),
    // Checked against null, not truthiness, so null never becomes "null".
    dueDate: row.due_date === null ? null : String(row.due_date),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** Every live amotan: soonest deadline first, no-deadline ones last. */
export async function getAmotans(): Promise<Amotan[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AmotanRow>(
    `SELECT id, title, amount_cents, due_date, created_at, updated_at
     FROM amotan
     WHERE deleted_at IS NULL
     ORDER BY due_date IS NULL, due_date ASC, title COLLATE NOCASE ASC`
  );
  return rows.map(toAmotan);
}

export async function getAmotanById(id: string): Promise<Amotan | null> {
  if (!isValidId(id)) {
    return null;
  }
  const db = await getDatabase();
  const row = await db.getFirstAsync<AmotanRow>(
    `SELECT id, title, amount_cents, due_date, created_at, updated_at
     FROM amotan
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [id]
  );
  return row ? toAmotan(row) : null;
}

/** Adds an amotan and returns the new id. */
export async function createAmotan(input: AmotanInput): Promise<string> {
  const db = await getDatabase();
  const id = newId();
  const timestamp = nowISO();
  await db.runAsync(
    `INSERT INTO amotan (id, title, amount_cents, due_date, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [id, input.title.trim(), input.amountCents, input.dueDate, timestamp, timestamp]
  );
  notifyLocalChange();
  return id;
}

export async function updateAmotan(
  id: string,
  input: AmotanInput
): Promise<boolean> {
  if (!isValidId(id)) {
    return false;
  }
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE amotan
     SET title = ?, amount_cents = ?, due_date = ?, updated_at = ?, synced = 0
     WHERE id = ? AND deleted_at IS NULL`,
    [input.title.trim(), input.amountCents, input.dueDate, nowISO(), id]
  );
  if (result.changes > 0) {
    notifyLocalChange();
  }
  return result.changes > 0;
}

/** Soft-deletes the amotan and every payment recorded toward it. */
export async function deleteAmotan(id: string): Promise<boolean> {
  if (!isValidId(id)) {
    return false;
  }
  const db = await getDatabase();
  const timestamp = nowISO();
  let deleted = false;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `UPDATE amotan
       SET deleted_at = ?, updated_at = ?, synced = 0
       WHERE id = ? AND deleted_at IS NULL`,
      [timestamp, timestamp, id]
    );
    deleted = result.changes > 0;
    if (deleted) {
      await db.runAsync(
        `UPDATE amotan_payments
         SET deleted_at = ?, updated_at = ?, synced = 0
         WHERE amotan_id = ? AND deleted_at IS NULL`,
        [timestamp, timestamp, id]
      );
    }
  });
  if (deleted) {
    notifyLocalChange();
  }
  return deleted;
}
