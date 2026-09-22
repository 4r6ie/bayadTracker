import * as SQLite from 'expo-sqlite';

import { migrateDatabase } from './migrations';

const DATABASE_NAME = 'bayadtracker.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await migrateDatabase(db);
  return db;
}

export function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndMigrate();
  }
  return databasePromise;
}