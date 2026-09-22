import { getDatabase } from './database';
import type { Payment, PaymentInput } from '../types/payment';

/**
 * The only place SQL is allowed.
 * Every statement uses `?` parameter binding so user input is never
 * concatenated into a query string.
 */

interface PaymentRow {
  id: number;
  payer_name: string;
  amount: number;
  description: string;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

function toPayment(row: PaymentRow): Payment {
  return {
    id: Number(row.id),
    payerName: String(row.payer_name),
    amount: Number(row.amount),
    description: String(row.description),
    paymentDate: String(row.payment_date),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function isValidId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}

export async function getPayments(): Promise<Payment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PaymentRow>(
    `SELECT id, payer_name, amount, description, payment_date, created_at, updated_at
     FROM payments
     ORDER BY payment_date DESC, id DESC`
  );
  return rows.map(toPayment);
}

export async function getPaymentById(id: number): Promise<Payment | null> {
  if (!isValidId(id)) {
    return null;
  }
  const db = await getDatabase();
  const row = await db.getFirstAsync<PaymentRow>(
    `SELECT id, payer_name, amount, description, payment_date, created_at, updated_at
     FROM payments
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return row ? toPayment(row) : null;
}

export async function createPayment(input: PaymentInput): Promise<number> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO payments (payer_name, amount, description, payment_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.payerName,
      input.amount,
      input.description,
      input.paymentDate,
      timestamp,
      timestamp,
    ]
  );
  return result.lastInsertRowId;
}

export async function updatePayment(
  id: number,
  input: PaymentInput
): Promise<boolean> {
  if (!isValidId(id)) {
    return false;
  }
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE payments
     SET payer_name = ?, amount = ?, description = ?, payment_date = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.payerName,
      input.amount,
      input.description,
      input.paymentDate,
      new Date().toISOString(),
      id,
    ]
  );
  return result.changes > 0;
}

export async function deletePayment(id: number): Promise<boolean> {
  if (!isValidId(id)) {
    return false;
  }
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM payments WHERE id = ?', [id]);
  return result.changes > 0;
}
