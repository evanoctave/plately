/**
 * Local-only persistence using expo-sqlite.
 *
 * Everything the user logs lives on-device in SQLite. There is no account,
 * no sign-in, and no network sync — which keeps the app free to run and makes
 * App Store privacy review straightforward (no data collection).
 *
 * Each entry stores a *snapshot* of its computed nutrition so historical logs
 * remain stable even if the food database is later updated.
 */

import * as SQLite from 'expo-sqlite';

import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';

export type EntrySource = 'photo' | 'search' | 'manual' | 'water';

export interface FoodEntry extends Nutrition {
  id: string;
  /** Local calendar day, "yyyy-MM-dd". */
  day: string;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Curated food id, when applicable. */
  foodId: string | null;
  name: string;
  grams: number;
  /** Local file URI of the captured photo, when applicable. */
  photoUri: string | null;
  source: EntrySource;
}

const NUTRITION_COLUMNS: (keyof Nutrition)[] = [
  'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar',
  'sodium', 'potassium', 'calcium', 'iron', 'magnesium',
  'vitaminA', 'vitaminC', 'vitaminD', 'water',
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('nutrisnap.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY NOT NULL,
          day TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          foodId TEXT,
          name TEXT NOT NULL,
          grams REAL NOT NULL,
          photoUri TEXT,
          source TEXT NOT NULL,
          calories REAL NOT NULL DEFAULT 0,
          protein REAL NOT NULL DEFAULT 0,
          carbs REAL NOT NULL DEFAULT 0,
          fat REAL NOT NULL DEFAULT 0,
          fiber REAL NOT NULL DEFAULT 0,
          sugar REAL NOT NULL DEFAULT 0,
          sodium REAL NOT NULL DEFAULT 0,
          potassium REAL NOT NULL DEFAULT 0,
          calcium REAL NOT NULL DEFAULT 0,
          iron REAL NOT NULL DEFAULT 0,
          magnesium REAL NOT NULL DEFAULT 0,
          vitaminA REAL NOT NULL DEFAULT 0,
          vitaminC REAL NOT NULL DEFAULT 0,
          vitaminD REAL NOT NULL DEFAULT 0,
          water REAL NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_entries_day ON entries (day);
      `);
      return db;
    })();
  }
  return dbPromise;
}

export interface NewEntryInput {
  day: string;
  foodId: string | null;
  name: string;
  grams: number;
  photoUri: string | null;
  source: EntrySource;
  nutrition: Nutrition;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function addEntry(input: NewEntryInput): Promise<FoodEntry> {
  const db = await getDb();
  const entry: FoodEntry = {
    id: makeId(),
    day: input.day,
    createdAt: Date.now(),
    foodId: input.foodId,
    name: input.name,
    grams: input.grams,
    photoUri: input.photoUri,
    source: input.source,
    ...ZERO_NUTRITION,
    ...input.nutrition,
  };

  await db.runAsync(
    `INSERT INTO entries
      (id, day, createdAt, foodId, name, grams, photoUri, source,
       calories, protein, carbs, fat, fiber, sugar,
       sodium, potassium, calcium, iron, magnesium,
       vitaminA, vitaminC, vitaminD, water)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id, entry.day, entry.createdAt, entry.foodId, entry.name,
      entry.grams, entry.photoUri, entry.source,
      entry.calories, entry.protein, entry.carbs, entry.fat, entry.fiber, entry.sugar,
      entry.sodium, entry.potassium, entry.calcium, entry.iron, entry.magnesium,
      entry.vitaminA, entry.vitaminC, entry.vitaminD, entry.water,
    ],
  );
  return entry;
}

export async function getEntriesForDay(day: string): Promise<FoodEntry[]> {
  const db = await getDb();
  return db.getAllAsync<FoodEntry>(
    'SELECT * FROM entries WHERE day = ? ORDER BY createdAt DESC',
    [day],
  );
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

export async function updateEntryGrams(id: string, grams: number, nutrition: Nutrition): Promise<void> {
  const db = await getDb();
  const sets = NUTRITION_COLUMNS.map((c) => `${c} = ?`).join(', ');
  await db.runAsync(
    `UPDATE entries SET grams = ?, ${sets} WHERE id = ?`,
    [grams, ...NUTRITION_COLUMNS.map((c) => nutrition[c]), id],
  );
}

/** Returns distinct days that have at least one entry, most recent first. */
export async function getLoggedDays(limit = 60): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string }>(
    'SELECT DISTINCT day FROM entries ORDER BY day DESC LIMIT ?',
    [limit],
  );
  return rows.map((r) => r.day);
}

/** Deletes all logged data. Used by Settings → "Erase all data". */
export async function clearAllEntries(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries');
}
