import type { SQLiteBindParams, SQLiteDatabase } from 'expo-sqlite';

import type {
  Payment,
  PaymentFilter,
  PaymentInput,
  PaymentQuery,
  PaymentSort,
  PaymentStats,
  PaymentStatus,
} from '@/types/payment';
import { currentMonthPrefix, todayISO } from '@/utils/date';

const PAYMENT_COLUMNS = `
  id,
  payer_name,
  description,
  amount,
  payment_date,
  status,
  notes,
  created_at,
  updated_at
`;

interface WhereClause {
  sql: string;
  params: (string | number)[];
}

function escapeLikeTerm(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function buildWhere(query: PaymentQuery): WhereClause {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  const searchTerm = query.search?.trim();
  if (searchTerm) {
    const pattern = `%${escapeLikeTerm(searchTerm)}%`;
    conditions.push(
      `(payer_name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR notes LIKE ? ESCAPE '\\')`
    );
    params.push(pattern, pattern, pattern);
  }

  const filter: PaymentFilter = query.filter ?? 'ALL';
  if (filter !== 'ALL') {
    conditions.push('status = ?');
    params.push(filter);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { sql: whereSql, params };
}

function orderByFor(sort: PaymentSort = 'NEWEST'): string {
  switch (sort) {
    case 'OLDEST':
      return 'payment_date ASC, id ASC';
    case 'AMOUNT_HIGH':
      return 'amount DESC, id DESC';
    case 'AMOUNT_LOW':
      return 'amount ASC, id ASC';
    case 'NEWEST':
    default:
      return 'payment_date DESC, id DESC';
  }
}

function toPayment(row: Record<string, unknown>): Payment {
  return {
    id: Number(row.id),
    payer_name: String(row.payer_name),
    description: String(row.description),
    amount: Number(row.amount),
    payment_date: String(row.payment_date),
    status: String(row.status) as PaymentStatus,
    notes: row.notes == null ? null : String(row.notes),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function toParams(
  query: PaymentQuery,
  where: WhereClause
): SQLiteBindParams {
  const params = [...where.params];
  if (query.limit != null) {
    params.push(query.limit);
    if (query.offset != null) {
      params.push(query.offset);
    }
  }
  return params;
}

export async function getPayments(
  db: SQLiteDatabase,
  query: PaymentQuery = {}
): Promise<Payment[]> {
  const where = buildWhere(query);
  let sql = `SELECT ${PAYMENT_COLUMNS} FROM payments ${where.sql} ORDER BY ${orderByFor(query.sort)}`;

  if (query.limit != null) {
    sql += ' LIMIT ?';
    if (query.offset != null) {
      sql += ' OFFSET ?';
    }
  }

  const rows = await db.getAllAsync<Record<string, unknown>>(
    sql,
    toParams(query, where)
  );
  return rows.map(toPayment);
}

export async function getPaymentById(
  db: SQLiteDatabase,
  id: number
): Promise<Payment | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE id = ?`,
    id
  );
  return row ? toPayment(row) : null;
}

export async function createPayment(
  db: SQLiteDatabase,
  input: PaymentInput
): Promise<number> {
  const timestamp = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO payments (payer_name, description, amount, payment_date, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.payer_name,
      input.description,
      input.amount,
      input.payment_date,
      input.status,
      input.notes,
      timestamp,
      timestamp,
    ]
  );
  return result.lastInsertRowId;
}

export async function updatePayment(
  db: SQLiteDatabase,
  id: number,
  input: PaymentInput
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE payments
     SET payer_name = ?, description = ?, amount = ?, payment_date = ?, status = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.payer_name,
      input.description,
      input.amount,
      input.payment_date,
      input.status,
      input.notes,
      new Date().toISOString(),
      id,
    ]
  );
  return result.changes > 0;
}

export async function deletePayment(
  db: SQLiteDatabase,
  id: number
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM payments WHERE id = ?', id);
  return result.changes > 0;
}

export async function deleteAllPayments(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM payments');
}

export async function getPaymentStats(
  db: SQLiteDatabase
): Promise<PaymentStats> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT
       COUNT(*) AS total_payments,
       SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) AS total_collected,
       COUNT(CASE WHEN status = 'PAID' AND payment_date = ? THEN 1 END) AS today_payments,
       SUM(CASE WHEN status = 'PAID' AND substr(payment_date, 1, 7) = ? THEN amount ELSE 0 END) AS monthly_total
     FROM payments`,
    todayISO(),
    currentMonthPrefix()
  );

  return {
    total_payments: Number(row?.total_payments ?? 0),
    total_collected: Number(row?.total_collected ?? 0),
    today_payments: Number(row?.today_payments ?? 0),
    monthly_total: Number(row?.monthly_total ?? 0),
  };
}

export async function getPaymentCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM payments'
  );
  return Number(row?.total ?? 0);
}