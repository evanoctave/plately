/**
 * Unified food catalog: the bundled USDA database plus the user's custom foods.
 *
 * Screens resolve foods through this module so a `custom:` id works exactly like
 * a built-in one. The custom layer is cached in memory and refreshed from
 * SQLite at startup (and after any create/delete).
 */

import { FOODS, searchFoods as searchStatic, type FoodItem } from './foods';
import { getCustomFoods } from '../db/customFoods';

let customFoods: FoodItem[] = [];
const index = new Map<string, FoodItem>();

function rebuildIndex() {
  index.clear();
  for (const f of FOODS) index.set(f.id, f);
  for (const f of customFoods) index.set(f.id, f);
}
rebuildIndex();

/** Loads custom foods from the DB into the in-memory catalog. */
export async function refreshCustomFoods(): Promise<void> {
  customFoods = await getCustomFoods();
  rebuildIndex();
}

export function getCachedCustomFoods(): FoodItem[] {
  return customFoods;
}

/** Resolves a food by id across both built-in and custom foods. */
export function getFood(id: string): FoodItem | undefined {
  return index.get(id);
}

/**
 * Registers a food that isn't persisted in the database (e.g. a product scanned
 * from Open Food Facts) so screens can resolve it by id during this session.
 * If the user logs it, the entry stores a full nutrition snapshot, so the data
 * survives even though the transient catalog entry does not.
 */
export function registerTransientFood(food: FoodItem): void {
  index.set(food.id, food);
}

/** Searches the combined catalog; custom foods are ranked first on ties. */
export function searchCatalog(query: string, limit = 30): FoodItem[] {
  const q = query.trim().toLowerCase();
  const staticHits = searchStatic(query, limit);

  if (customFoods.length === 0) return staticHits;

  const customHits = customFoods.filter((f) => {
    if (!q) return true;
    return f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
  });

  // Custom foods first (user intent), then static, de-duplicated, capped.
  const seen = new Set<string>();
  const merged: FoodItem[] = [];
  for (const f of [...customHits, ...staticHits]) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    merged.push(f);
    if (merged.length >= limit) break;
  }
  return merged;
}
