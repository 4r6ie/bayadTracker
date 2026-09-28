import { notifyLocalChange } from '../sync/events';
import type { Student, StudentInput } from '../types/amotan';
import { getDatabase } from './database';
import { isValidId, newId, nowISO } from './ids';

/**
 * The only place SQL for `students` is allowed. Every statement binds values
 * with `?`, so user input is never concatenated into a query.
 *
 * Rows are soft-deleted (`deleted_at`) so a delete can sync to the other
 * phone; every read filters them out. Every write sets `synced = 0` so the
 * sync engine knows to upload it.
 */

interface StudentRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function toStudent(row: StudentRow): Student {
  return {
    id: String(row.id),
    name: String(row.name),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class DuplicateStudentError extends Error {
  constructor() {
    super('A student with that name already exists.');
    this.name = 'DuplicateStudentError';
  }
}

/**
 * Duplicate names are checked here instead of with a UNIQUE constraint:
 * two phones may add the same name while offline, and pulling the other
 * phone's row must never make the sync fail.
 */
async function assertNameIsFree(name: string, exceptId?: string): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id
     FROM students
     WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL AND id != ?
     LIMIT 1`,
    [name, exceptId ?? '']
  );
  if (row) {
    throw new DuplicateStudentError();
  }
}

export async function getStudents(): Promise<Student[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<StudentRow>(
    `SELECT id, name, created_at, updated_at
     FROM students
     WHERE deleted_at IS NULL
     ORDER BY name COLLATE NOCASE ASC`
  );
  return rows.map(toStudent);
}

export async function getStudentById(id: string): Promise<Student | null> {
  if (!isValidId(id)) {
    return null;
  }
  const db = await getDatabase();
  const row = await db.getFirstAsync<StudentRow>(
    `SELECT id, name, created_at, updated_at
     FROM students
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [id]
  );
  return row ? toStudent(row) : null;
}

/** Adds a student and returns the new id. */
export async function createStudent(input: StudentInput): Promise<string> {
  const name = input.name.trim();
  await assertNameIsFree(name);
  const db = await getDatabase();
  const id = newId();
  const timestamp = nowISO();
  await db.runAsync(
    `INSERT INTO students (id, name, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, 0)`,
    [id, name, timestamp, timestamp]
  );
  notifyLocalChange();
  return id;
}

export async function updateStudent(
  id: string,
  input: StudentInput
): Promise<boolean> {
  if (!isValidId(id)) {
    return false;
  }
  const name = input.name.trim();
  await assertNameIsFree(name, id);
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE students
     SET name = ?, updated_at = ?, synced = 0
     WHERE id = ? AND deleted_at IS NULL`,
    [name, nowISO(), id]
  );
  if (result.changes > 0) {
    notifyLocalChange();
  }
  return result.changes > 0;
}

/**
 * Soft-deletes the student and every payment they recorded, in one
 * transaction, so the other phone receives both deletes.
 */
export async function deleteStudent(id: string): Promise<boolean> {
  if (!isValidId(id)) {
    return false;
  }
  const db = await getDatabase();
  const timestamp = nowISO();
  let deleted = false;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `UPDATE students
       SET deleted_at = ?, updated_at = ?, synced = 0
       WHERE id = ? AND deleted_at IS NULL`,
      [timestamp, timestamp, id]
    );
    deleted = result.changes > 0;
    if (deleted) {
      await db.runAsync(
        `UPDATE amotan_payments
         SET deleted_at = ?, updated_at = ?, synced = 0
         WHERE student_id = ? AND deleted_at IS NULL`,
        [timestamp, timestamp, id]
      );
    }
  });
  if (deleted) {
    notifyLocalChange();
  }
  return deleted;
}
