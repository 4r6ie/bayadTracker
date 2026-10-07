import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'bayadtracker.db';

/**
 * Schema version stored in `PRAGMA user_version`. To change the schema, bump
 * this and add an `if (version < N)` block to `migrate()`. Never edit a block
 * that already ran on a phone: it will not run there again.
 */
const DATABASE_VERSION = 2;

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

    if (version < 2) {
      // v2: make every row safe to sync between phones.
      // - UUID text ids: two offline phones can both create rows without
      //   their ids colliding (AUTOINCREMENT would give both "#5").
      // - deleted_at (soft delete): a deleted row stays as a tombstone so
      //   the delete can reach the other phone.
      // - synced: 0 = changed here and not uploaded yet, 1 = uploaded.
      // - No UNIQUE on students.name: two phones can add the same name
      //   offline, and a pulled row must never make the sync fail. The
      //   repository checks for duplicates instead.
      // - No ON DELETE CASCADE: nothing is hard-deleted anymore; deleting a
      //   parent soft-deletes its payments in the repository.
      // The v1 tables only ever held test data, so they are recreated.
      await db.execAsync(`
        DROP TABLE IF EXISTS amotan_payments;
        DROP TABLE IF EXISTS amotan;
        DROP TABLE IF EXISTS students;

        CREATE TABLE students (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          synced INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE amotan (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          due_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          synced INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE amotan_payments (
          id TEXT PRIMARY KEY NOT NULL,
          student_id TEXT NOT NULL REFERENCES students (id),
          amotan_id TEXT NOT NULL REFERENCES amotan (id),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          paid_date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          synced INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX idx_amotan_payments_amotan_student
          ON amotan_payments (amotan_id, student_id);
        CREATE INDEX idx_amotan_payments_student
          ON amotan_payments (student_id);

        -- One row per synced table: the server timestamp of the newest
        -- change already pulled, so the next pull only asks for newer ones.
        CREATE TABLE sync_state (
          table_name TEXT PRIMARY KEY NOT NULL,
          last_pulled_at TEXT
        );
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