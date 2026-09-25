import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'bayadtracker.db';

const DATABASE_VERSION = 1;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void>{
  
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );

  const version = row?.user_version ?? 0;

  if (version>= DATABASE_VERSION){
    return;
  }

  await db.withTransactionAsync(async () => {

    if(version < 1){
      await db.execAsync(`
        DROP TABLE IF EXISTS payments;
        
        CREATE TABLE students(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL COLLATE NOCASE UNIQUE,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
          );
          
        CREATE TABLE amotan (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          due_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE amotan_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL
            REFERENCES students (id) ON DELETE CASCADE,
          amotan_id INTEGER NOT NULL
            REFERENCES amotan (id) ON DELETE CASCADE,
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          paid_date TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX idx_amotan_payments_amotan_student
          ON amotan_payments (amotan_id, student_id);
        CREATE INDEX idx_amotan_payments_student
          ON amotan_payments (student_id);
        `);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);

  });
}
  async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);

    await migrate(db);
    return db;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabase().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase>{
  return getDatabase();
}