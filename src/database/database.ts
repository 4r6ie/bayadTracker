import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'bayadtracker.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

/**
 * Returns a shared SQLite connection.
 * The table is created on first use, so data persists between app restarts.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabase().catch((error) => {
      // Reset so a failed open can be retried instead of caching a rejection.
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

/** Used by the repository to create the table; safe to call from anywhere. */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  return getDatabase();
}
