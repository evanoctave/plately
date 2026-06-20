// =============================================================================
// db/customFoods — User-created foods (SQLite)
// =============================================================================
// Lets the user add foods that aren't in the built-in catalog (homemade meals,
// regional brands, etc.). They live in their own `custom_foods` table but
// share the same `FoodItem` shape as built-in foods. Ids are prefixed with
// `custom:` so resolution code can disambiguate.
//
// In-memory access: `src/data/catalog.ts` calls `refreshCustomFoods()` (loaded
// here) into a Map, and search/log lookups go through the catalog rather than
// hitting SQLite again.

import * as SQLite from 'expo-sqlite';

import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';
import type { FoodItem } from '../data/foods';

export const CUSTOM_PREFIX = 'custom:';

export function isCustomId(id: string): boolean {
  return id.startsWith(CUSTOM_PREFIX);
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('plately.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS custom_foods (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          servingGrams REAL NOT NULL,
          servingLabel TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
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
      `);
      return db;
    })();
  }
  return dbPromise;
}

interface CustomRow extends Nutrition {
  id: string;
  name: string;
  category: string;
  servingGrams: number;
  servingLabel: string;
  createdAt: number;
}

function rowToFood(row: CustomRow): FoodItem {
  const { id, name, category, servingGrams, servingLabel, ...rest } = row;
  const per100g: Nutrition = { ...ZERO_NUTRITION };
  for (const key of Object.keys(ZERO_NUTRITION) as (keyof Nutrition)[]) {
    per100g[key] = rest[key] ?? 0;
  }
  return {
    id,
    name,
    category,
    aliases: [name.toLowerCase()],
    servingGrams,
    servingLabel,
    per100g,
  };
}

export interface NewCustomFood {
  name: string;
  category: string;
  servingGrams: number;
  servingLabel: string;
  /** Nutrition per 100 g. */
  per100g: Nutrition;
}

function makeId(): string {
  return `${CUSTOM_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function addCustomFood(input: NewCustomFood): Promise<FoodItem> {
  const db = await getDb();
  const id = makeId();
  const n = input.per100g;
  await db.runAsync(
    `INSERT INTO custom_foods
      (id, name, category, servingGrams, servingLabel, createdAt,
       calories, protein, carbs, fat, fiber, sugar,
       sodium, potassium, calcium, iron, magnesium,
       vitaminA, vitaminC, vitaminD, water)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, input.name, input.category, input.servingGrams, input.servingLabel, Date.now(),
      n.calories, n.protein, n.carbs, n.fat, n.fiber, n.sugar,
      n.sodium, n.potassium, n.calcium, n.iron, n.magnesium,
      n.vitaminA, n.vitaminC, n.vitaminD, n.water,
    ],
  );
  return rowToFood({
    id,
    name: input.name,
    category: input.category,
    servingGrams: input.servingGrams,
    servingLabel: input.servingLabel,
    createdAt: Date.now(),
    ...ZERO_NUTRITION,
    ...input.per100g,
  });
}

export async function getCustomFoods(): Promise<FoodItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CustomRow>('SELECT * FROM custom_foods ORDER BY createdAt DESC');
  return rows.map(rowToFood);
}

export async function deleteCustomFood(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM custom_foods WHERE id = ?', [id]);
}
