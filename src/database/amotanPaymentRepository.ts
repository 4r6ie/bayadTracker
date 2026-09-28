import { notifyLocalChange } from '../sync/events';
import type {
  AmotanPayment,
  AmotanPaymentInput,
  AmotanRosterEntry,
  StudentChecklistEntry,
} from '../types/amotan';
import { getPaymentStatus } from '../utils/paymentStatus';
import { getAmotanById } from './amotanRepository';
import { getDatabase } from './database';
import { isValidId, newId, nowISO } from './ids';
import { getStudentById } from './studentRepository';

/**
 * The payment ledger: one row per installment. Totals and statuses are
 * computed from these rows, never stored.
 */

interface AmotanPaymentRow {
  id: string;
  student_id: string;
  amotan_id: string;
  amount_cents: number;
  paid_date: string;
  created_at: string;
  updated_at: string;
}

function toAmotanPayment(row: AmotanPaymentRow): AmotanPayment {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    amotanId: String(row.amotan_id),
    amountCents: Number(row.amount_cents),
    paidDate: String(row.paid_date),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** Records one installment and returns the new id. */
export async function recordPayment(input: AmotanPaymentInput): Promise<string> {
  const db = await getDatabase();
  const id = newId();
  const timestamp = nowISO();
  await db.runAsync(
    `INSERT INTO amotan_payments
       (id, student_id, amotan_id, amount_cents, paid_date, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      id,
      input.studentId,
      input.amotanId,
      input.amountCents,
      input.paidDate,
      timestamp,
      timestamp,
    ]
  );
  notifyLocalChange();
  return id;
}

/** Every live installment a student paid toward one amotan, newest first. */
export async function getPaymentForStudentAndAmotan(
  studentId: string,
  amotanId: string
): Promise<AmotanPayment[]> {
  if (!isValidId(studentId) || !isValidId(amotanId)) {
    return [];
  }
  const db = await getDatabase();
  const rows = await db.getAllAsync<AmotanPaymentRow>(
    `SELECT id, student_id, amotan_id, amount_cents, paid_date, created_at, updated_at
     FROM amotan_payments
     WHERE student_id = ? AND amotan_id = ? AND deleted_at IS NULL
     ORDER BY paid_date DESC, created_at DESC`,
    [studentId, amotanId]
  );
  return rows.map(toAmotanPayment);
}

/**
 * Fixes the amount or date of an installment. The student and amotan never
 * change: a payment recorded for the wrong one is deleted and re-recorded.
 */
export async function updatePayment(
  id: string,
  input: Pick<AmotanPaymentInput, 'amountCents' | 'paidDate'>
): Promise<boolean> {
  if (!isValidId(id)) {
    return false;
  }
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE amotan_payments
     SET amount_cents = ?, paid_date = ?, updated_at = ?, synced = 0
     WHERE id = ? AND deleted_at IS NULL`,
    [input.amountCents, input.paidDate, nowISO(), id]
  );
  if (result.changes > 0) {
    notifyLocalChange();
  }
  return result.changes > 0;
}

export async function deletePayment(id: string): Promise<boolean> {
  if (!isValidId(id)) {
    return false;
  }
  const db = await getDatabase();
  const timestamp = nowISO();
  const result = await db.runAsync(
    `UPDATE amotan_payments
     SET deleted_at = ?, updated_at = ?, synced = 0
     WHERE id = ? AND deleted_at IS NULL`,
    [timestamp, timestamp, id]
  );
  if (result.changes > 0) {
    notifyLocalChange();
  }
  return result.changes > 0;
}

/**
 * Every live student with how much they paid toward one amotan, including
 * students who have not paid at all (paid = 0).
 *
 * Both filters on `p` sit in the ON clause, not WHERE: in WHERE they would
 * drop the students with no payment row, turning this into an INNER JOIN.
 */
export async function getAmotanRoster(
  amotanId: string
): Promise<AmotanRosterEntry[]> {
  const amotan = await getAmotanById(amotanId);
  if (!amotan) {
    return [];
  }
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    student_id: string;
    student_name: string;
    paid_cents: number;
  }>(
    `SELECT s.id AS student_id,
            s.name AS student_name,
            COALESCE(SUM(p.amount_cents), 0) AS paid_cents
     FROM students s
     LEFT JOIN amotan_payments p
       ON p.student_id = s.id
      AND p.amotan_id = ?
      AND p.deleted_at IS NULL
     WHERE s.deleted_at IS NULL
     GROUP BY s.id
     ORDER BY s.name COLLATE NOCASE ASC`,
    [amotanId]
  );
  return rows.map((row) => {
    const paidCents = Number(row.paid_cents);
    return {
      studentId: String(row.student_id),
      studentName: String(row.student_name),
      paidCents,
      status: getPaymentStatus(paidCents, amotan.amountCents),
    };
  });
}

/**
 * Every live amotan with how much one student paid toward it: the
 * student's checklist. The mirror image of `getAmotanRoster`.
 */
export async function getStudentChecklist(
  studentId: string
): Promise<StudentChecklistEntry[]> {
  const student = await getStudentById(studentId);
  if (!student) {
    return [];
  }
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    amotan_id: string;
    title: string;
    target_cents: number;
    due_date: string | null;
    paid_cents: number;
  }>(
    `SELECT a.id AS amotan_id,
            a.title AS title,
            a.amount_cents AS target_cents,
            a.due_date AS due_date,
            COALESCE(SUM(p.amount_cents), 0) AS paid_cents
     FROM amotan a
     LEFT JOIN amotan_payments p
       ON p.amotan_id = a.id
      AND p.student_id = ?
      AND p.deleted_at IS NULL
     WHERE a.deleted_at IS NULL
     GROUP BY a.id
     ORDER BY a.due_date IS NULL, a.due_date ASC, a.title COLLATE NOCASE ASC`,
    [studentId]
  );
  return rows.map((row) => {
    const paidCents = Number(row.paid_cents);
    const targetCents = Number(row.target_cents);
    return {
      amotanId: String(row.amotan_id),
      title: String(row.title),
      targetCents,
      dueDate: row.due_date === null ? null : String(row.due_date),
      paidCents,
      status: getPaymentStatus(paidCents, targetCents),
    };
  });
}
