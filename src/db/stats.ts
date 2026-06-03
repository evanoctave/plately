// Aggregate diary queries for the Insights screen.

import * as SQLite from 'expo-sqlite';

import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('plately.db');
  }
  return dbPromise;
}

const NUTRITION_KEYS = Object.keys(ZERO_NUTRITION) as (keyof Nutrition)[];

export interface DayTotals extends Nutrition {
  day: string;
  itemCount: number; // non-water entries that day
}

// Summed nutrition per day. Missing days return zeroes for a continuous x-axis.
export async function getDailyTotals(days: string[]): Promise<DayTotals[]> {
  if (days.length === 0) return [];
  const db = await getDb();
  const placeholders = days.map(() => '?').join(',');
  const sumCols = NUTRITION_KEYS.map((k) => `SUM(${k}) as ${k}`).join(', ');

  const rows = await db.getAllAsync<DayTotals & Record<string, number>>(
    `SELECT day,
            ${sumCols},
            SUM(CASE WHEN source != 'water' THEN 1 ELSE 0 END) as itemCount
     FROM entries
     WHERE day IN (${placeholders})
     GROUP BY day`,
    days,
  );

  const byDay = new Map(rows.map((r) => [r.day, r]));
  return days.map((day) => {
    const row = byDay.get(day);
    const totals = { ...ZERO_NUTRITION } as Nutrition;
    if (row) {
      for (const key of NUTRITION_KEYS) totals[key] = row[key] ?? 0;
    }
    return { day, itemCount: row?.itemCount ?? 0, ...totals };
  });
}

// All distinct logged day-keys (for streak math).
export async function getAllLoggedDayKeys(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string }>('SELECT DISTINCT day FROM entries');
  return rows.map((r) => r.day);
}

export interface RecentFood {
  foodId: string;
  name: string;
  lastGrams: number;
  lastUsed: number;
}

// Most-recently logged distinct foods (excluding water), for quick re-logging.
export async function getRecentFoods(limit = 8): Promise<RecentFood[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RecentFood>(
    `SELECT foodId,
            name,
            grams as lastGrams,
            MAX(createdAt) as lastUsed
     FROM entries
     WHERE source != 'water' AND foodId IS NOT NULL
     GROUP BY foodId
     ORDER BY lastUsed DESC
     LIMIT ?`,
    [limit],
  );
  return rows;
}
