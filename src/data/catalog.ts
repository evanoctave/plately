// Unified catalog: bundled USDA foods + the user's custom foods (cached in
// memory, refreshed from SQLite). Lets a `custom:` id resolve like a built-in.

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

// Loads custom foods from the DB into the in-memory catalog.
export async function refreshCustomFoods(): Promise<void> {
  customFoods = await getCustomFoods();
  rebuildIndex();
}

export function getCachedCustomFoods(): FoodItem[] {
  return customFoods;
}

export function getFood(id: string): FoodItem | undefined {
  return index.get(id);
}

// Registers a non-persisted food (e.g. a scanned product) for this session.
// Logging it stores a full nutrition snapshot, so the data survives regardless.
export function registerTransientFood(food: FoodItem): void {
  index.set(food.id, food);
}

// Searches the combined catalog; custom foods rank first on ties.
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
