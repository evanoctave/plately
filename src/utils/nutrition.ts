import {
  MICRO_META,
  ZERO_NUTRITION,
  type Nutrition,
} from '../data/nutrients';
import type { FoodItem } from '../data/foods';

const NUTRITION_KEYS = Object.keys(ZERO_NUTRITION) as (keyof Nutrition)[];

/** Scales a food's per-100g profile to an arbitrary gram amount. */
export function nutritionForGrams(food: FoodItem, grams: number): Nutrition {
  const factor = grams / 100;
  const out = { ...ZERO_NUTRITION };
  for (const key of NUTRITION_KEYS) {
    out[key] = round(food.per100g[key] * factor);
  }
  return out;
}

/** Sums an arbitrary list of nutrition profiles. */
export function sumNutrition(items: Nutrition[]): Nutrition {
  const out = { ...ZERO_NUTRITION };
  for (const item of items) {
    for (const key of NUTRITION_KEYS) {
      out[key] += item[key];
    }
  }
  for (const key of NUTRITION_KEYS) out[key] = round(out[key]);
  return out;
}

/** Rounds to one decimal to avoid floating-point noise in totals. */
export function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Clamps a fraction to [0,1] for progress bars/rings. */
export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function microPercentOfDaily(key: (typeof MICRO_META)[number]['key'], amount: number): number {
  const meta = MICRO_META.find((m) => m.key === key);
  if (!meta) return 0;
  return Math.round((amount / meta.dailyValue) * 100);
}
