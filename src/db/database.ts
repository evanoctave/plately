// =============================================================================
// db/database — Diary entry persistence (SQLite)
// =============================================================================
// All food entries (camera-detected, searched, manual, water) live in a single
// `entries` table inside the local SQLite database. The database is created
// lazily on first access via `getDb()` and reused for the rest of the session.
//
// Why a nutrition snapshot per row:
//   When you log "Apple — 150g" we copy the calories/protein/etc. into the row.
//   That way, if the foods catalog later updates its values (better data, new
//   source), already-logged entries stay stable — what you saw is what's in
//   the history.
//
// Schema is owned here. Other db/* files (favorites, weights, fasting,
// mealPlan, etc.) each create their own tables but share the same database
// instance through `getDb()` — they all call `SQLite.openDatabaseAsync` on
// the same `plately.db` file.
//
// Read patterns:
//   - getEntriesForDay(day)  → Home screen, DayDetail
//   - getLoggedDays(limit)   → streaks, history calendar
//   - getAllEntries()        → CSV export, achievement totals
//
// Writes always go through `addEntry` / `deleteEntry` / `updateEntryGrams`,
// which are also the only entry points called from `useDiary` (which bumps
// the revision counter for live UI updates).

import * as SQLite from 'expo-sqlite';

import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';

/** How an entry was created. Drives the icon shown in the diary row. */
export type EntrySource = 'photo' | 'search' | 'manual' | 'water';

/** One row in the `entries` table. Includes a baked-in nutrition snapshot. */
export interface FoodEntry extends Nutrition {
  id: string;
  day: string; // "yyyy-MM-dd"
  createdAt: number; // epoch ms
  foodId: string | null;
  name: string;
  grams: number;
  photoUri: string | null;
  source: EntrySource;
}

/** Column order used by `updateEntryGrams` to keep the SET clause aligned. */
const NUTRITION_COLUMNS: (keyof Nutrition)[] = [
  'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar',
  'sodium', 'potassium', 'calcium', 'iron', 'magnesium',
  'vitaminA', 'vitaminC', 'vitaminD', 'water',
];

// Single shared db handle, created on first use. Subsequent callers await the
// same promise so the CREATE TABLE only runs once per launch.
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Returns the SQLite handle, creating the table on first call. Schema changes
 * should go here (and be additive — there is no migration system yet).
 */
async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('plately.db');
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

/** Ensure the table exists. Called by the sync engine before it attaches triggers. */
export async function ensureReady(): Promise<void> {
  await getDb();
}

/** Shape required to insert a new entry. The id + createdAt are filled in by `addEntry`. */
export interface NewEntryInput {
  day: string;
  foodId: string | null;
  name: string;
  grams: number;
  photoUri: string | null;
  source: EntrySource;
  nutrition: Nutrition;
}

/** Sortable, collision-resistant id (timestamp + random suffix). Not a UUID. */
function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Insert a new entry and return the saved row. Callers should not call this
 * directly — go through `state/useDiary.logEntry` so the diary revision bumps
 * and screens refetch.
 */
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

/** All entries logged on a given day, newest first. */
export async function getEntriesForDay(day: string): Promise<FoodEntry[]> {
  const db = await getDb();
  return db.getAllAsync<FoodEntry>(
    'SELECT * FROM entries WHERE day = ? ORDER BY createdAt DESC',
    [day],
  );
}

/** Hard delete. No soft-delete / undo — the UI guards with a confirmation alert. */
export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

/**
 * Update both grams AND the nutrition snapshot. The caller is responsible for
 * recomputing the snapshot — typically `nutritionForGrams(food, grams)`.
 */
export async function updateEntryGrams(id: string, grams: number, nutrition: Nutrition): Promise<void> {
  const db = await getDb();
  const sets = NUTRITION_COLUMNS.map((c) => `${c} = ?`).join(', ');
  await db.runAsync(
    `UPDATE entries SET grams = ?, ${sets} WHERE id = ?`,
    [grams, ...NUTRITION_COLUMNS.map((c) => nutrition[c]), id],
  );
}

/** Distinct days with at least one entry, most recent first. Powers streaks + history. */
export async function getLoggedDays(limit = 60): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string }>(
    'SELECT DISTINCT day FROM entries ORDER BY day DESC LIMIT ?',
    [limit],
  );
  return rows.map((r) => r.day);
}

/** All entries, newest first. Used for CSV export and achievement totals. */
export async function getAllEntries(): Promise<FoodEntry[]> {
  const db = await getDb();
  return db.getAllAsync<FoodEntry>('SELECT * FROM entries ORDER BY createdAt DESC');
}

/** Wipe every entry. Only called from Settings → "Erase all data". */
export async function clearAllEntries(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries');
}
