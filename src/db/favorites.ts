// =============================================================================
// db/favorites — Favorite food ids (SQLite)
// =============================================================================
// Lightweight table that just stores `foodId → createdAt`. The actual food
// objects come from `src/data/catalog.ts` at read time. Drives the favorites
// half of the Quick Add strip on the Home screen.

import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('plately.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS favorites (
          foodId TEXT PRIMARY KEY NOT NULL,
          createdAt INTEGER NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function getFavoriteIds(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ foodId: string }>(
    'SELECT foodId FROM favorites ORDER BY createdAt DESC',
  );
  return rows.map((r) => r.foodId);
}

export async function isFavorite(foodId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ foodId: string }>(
    'SELECT foodId FROM favorites WHERE foodId = ?',
    [foodId],
  );
  return !!row;
}

export async function addFavorite(foodId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO favorites (foodId, createdAt) VALUES (?, ?)',
    [foodId, Date.now()],
  );
}

export async function removeFavorite(foodId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM favorites WHERE foodId = ?', [foodId]);
}

export async function toggleFavorite(foodId: string): Promise<boolean> {
  if (await isFavorite(foodId)) {
    await removeFavorite(foodId);
    return false;
  }
  await addFavorite(foodId);
  return true;
}
