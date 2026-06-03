import type { Nutrition } from './nutrients';
import foodsJson from './foods.json';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  aliases: string[];
  /** Default serving size in grams. */
  servingGrams: number;
  /** Human-readable serving description, e.g. "1 medium (182 g)". */
  servingLabel: string;
  /** Nutrition per 100 g of edible portion. */
  per100g: Nutrition;
}

interface FoodsFile {
  schema: string;
  source: string;
  items: FoodItem[];
}

const file = foodsJson as FoodsFile;

export const FOODS: FoodItem[] = file.items;
export const FOOD_DB_SOURCE = file.source;

const byId = new Map<string, FoodItem>(FOODS.map((f) => [f.id, f]));

export function getFoodById(id: string): FoodItem | undefined {
  return byId.get(id);
}

// Case-insensitive fuzzy search over name/aliases/category; prefix matches
// rank above substring matches.
export function searchFoods(query: string, limit = 30): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS.slice(0, limit);

  const scored: { item: FoodItem; score: number }[] = [];
  for (const item of FOODS) {
    const haystacks = [item.name.toLowerCase(), ...item.aliases.map((a) => a.toLowerCase())];
    let best = Infinity;
    for (const h of haystacks) {
      if (h === q) best = Math.min(best, 0);
      else if (h.startsWith(q)) best = Math.min(best, 1);
      else if (h.includes(q)) best = Math.min(best, 2);
    }
    if (item.category.toLowerCase().includes(q)) best = Math.min(best, 3);
    if (best !== Infinity) scored.push({ item, score: best });
  }

  return scored
    .sort((a, b) => a.score - b.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
    .map((s) => s.item);
}
