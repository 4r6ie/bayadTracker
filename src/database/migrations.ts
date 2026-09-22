import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 1;

export const PAYMENTS_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payer_name TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PAID',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const PAYMENTS_INDEXES_DDL = `
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
`;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentVersion = row?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      ${PAYMENTS_TABLE_DDL}
      ${PAYMENTS_INDEXES_DDL}
    `);
    currentVersion = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}