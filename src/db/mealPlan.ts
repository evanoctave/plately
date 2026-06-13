import * as SQLite from 'expo-sqlite';

import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';

export interface PlanItem extends Nutrition {
  id: string;
  day: string; // "yyyy-MM-dd"
  foodId: string | null;
  name: string;
  grams: number;
  createdAt: number;
}

const NUTRITION_COLUMNS: (keyof Nutrition)[] = Object.keys(ZERO_NUTRITION) as (keyof Nutrition)[];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('plately.db');
      const cols = NUTRITION_COLUMNS.map((c) => `${c} REAL NOT NULL DEFAULT 0`).join(',\n          ');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS plan_items (
          id TEXT PRIMARY KEY NOT NULL,
          day TEXT NOT NULL,
          foodId TEXT,
          name TEXT NOT NULL,
          grams REAL NOT NULL,
          createdAt INTEGER NOT NULL,
          ${cols}
        );
        CREATE INDEX IF NOT EXISTS idx_plan_day ON plan_items (day);
      `);
      return db;
    })();
  }
  return dbPromise;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface NewPlanItem {
  day: string;
  foodId: string | null;
  name: string;
  grams: number;
  nutrition: Nutrition;
}

export async function addPlanItem(input: NewPlanItem): Promise<PlanItem> {
  const db = await getDb();
  const item: PlanItem = {
    id: makeId(),
    day: input.day,
    foodId: input.foodId,
    name: input.name,
    grams: input.grams,
    createdAt: Date.now(),
    ...ZERO_NUTRITION,
    ...input.nutrition,
  };
  const placeholders = NUTRITION_COLUMNS.map(() => '?').join(', ');
  await db.runAsync(
    `INSERT INTO plan_items (id, day, foodId, name, grams, createdAt, ${NUTRITION_COLUMNS.join(', ')})
     VALUES (?, ?, ?, ?, ?, ?, ${placeholders})`,
    [
      item.id, item.day, item.foodId, item.name, item.grams, item.createdAt,
      ...NUTRITION_COLUMNS.map((c) => item[c]),
    ],
  );
  return item;
}

export async function getPlanForDay(day: string): Promise<PlanItem[]> {
  const db = await getDb();
  return db.getAllAsync<PlanItem>(
    'SELECT * FROM plan_items WHERE day = ? ORDER BY createdAt ASC',
    [day],
  );
}

export async function deletePlanItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM plan_items WHERE id = ?', [id]);
}

export async function clearPlanForDay(day: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM plan_items WHERE day = ?', [day]);
}

/** Distinct days that have at least one planned item, soonest first. */
export async function getPlannedDays(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string }>(
    'SELECT DISTINCT day FROM plan_items ORDER BY day ASC',
  );
  return rows.map((r) => r.day);
}
