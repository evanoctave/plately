/**
 * Barcode → food lookup via Open Food Facts (https://openfoodfacts.org).
 *
 * Open Food Facts is a free, open, crowd-sourced product database with no API
 * key and no usage cost — a perfect fit for a $0 app. Barcode scanning is a
 * paid/premium feature in several mainstream trackers; here it's free.
 *
 * Network is only touched when the user actively scans a barcode. Lookups fail
 * soft (return null) so the app stays usable offline.
 */

import { ZERO_NUTRITION, type Nutrition } from './nutrients';
import type { FoodItem } from './foods';

export const OFF_PREFIX = 'off:';

const ENDPOINT = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS =
  'product_name,brands,serving_quantity,nutriments';
const TIMEOUT_MS = 8000;

/** Subset of the Open Food Facts product shape we consume. */
interface OffNutriments {
  ['energy-kcal_100g']?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  /** grams per 100 g */
  sodium_100g?: number;
  salt_100g?: number;
  potassium_100g?: number;
  calcium_100g?: number;
  iron_100g?: number;
  magnesium_100g?: number;
  ['vitamin-a_100g']?: number;
  ['vitamin-c_100g']?: number;
  ['vitamin-d_100g']?: number;
  [key: string]: number | undefined;
}

export interface OffProduct {
  product_name?: string;
  brands?: string;
  serving_quantity?: number | string;
  nutriments?: OffNutriments;
}

interface OffResponse {
  status?: number;
  product?: OffProduct;
}

function n(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Maps an Open Food Facts product to our `FoodItem` (per-100g). Returns null if
 * the product lacks even a name or any usable energy/macro data.
 */
export function mapProductToFood(barcode: string, product: OffProduct): FoodItem | null {
  const name = (product.product_name ?? '').trim();
  if (!name) return null;

  const nm = product.nutriments ?? {};
  const calories = n(nm['energy-kcal_100g']);
  const protein = n(nm.proteins_100g);
  const carbs = n(nm.carbohydrates_100g);
  const fat = n(nm.fat_100g);

  // Reject products with no usable nutrition at all.
  if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) return null;

  // Sodium: prefer sodium (g→mg); else derive from salt (salt g / 2.5 → sodium g).
  const sodiumG = nm.sodium_100g ?? (nm.salt_100g !== undefined ? nm.salt_100g / 2.5 : 0);

  const per100g: Nutrition = {
    ...ZERO_NUTRITION,
    calories,
    protein,
    carbs,
    fat,
    fiber: n(nm.fiber_100g),
    sugar: n(nm.sugars_100g),
    sodium: n(sodiumG) * 1000,
    potassium: n(nm.potassium_100g) * 1000,
    calcium: n(nm.calcium_100g) * 1000,
    iron: n(nm.iron_100g) * 1000,
    magnesium: n(nm.magnesium_100g) * 1000,
    vitaminA: n(nm['vitamin-a_100g']) * 1_000_000, // g → µg
    vitaminC: n(nm['vitamin-c_100g']) * 1000, // g → mg
    vitaminD: n(nm['vitamin-d_100g']) * 1_000_000, // g → µg
    water: 0,
  };

  const servingRaw =
    typeof product.serving_quantity === 'string'
      ? parseFloat(product.serving_quantity)
      : product.serving_quantity;
  const servingGrams = servingRaw && Number.isFinite(servingRaw) && servingRaw > 0 ? servingRaw : 100;

  const brand = (product.brands ?? '').split(',')[0]?.trim();
  const displayName = brand ? `${name} (${brand})` : name;

  return {
    id: `${OFF_PREFIX}${barcode}`,
    name: displayName,
    category: 'Scanned',
    aliases: [name.toLowerCase()],
    servingGrams: Math.round(servingGrams),
    servingLabel: `1 serving (${Math.round(servingGrams)} g)`,
    per100g,
  };
}

export type BarcodeLookup =
  | { status: 'found'; food: FoodItem }
  | { status: 'not_found' }
  | { status: 'error' };

/** Fetches and maps a product by barcode. Never throws. */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookup> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ENDPOINT}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'NutriSnap/1.0 (open-source nutrition app)' },
    });
    if (!res.ok) return { status: 'error' };
    const data = (await res.json()) as OffResponse;
    if (data.status !== 1 || !data.product) return { status: 'not_found' };
    const food = mapProductToFood(barcode, data.product);
    return food ? { status: 'found', food } : { status: 'not_found' };
  } catch {
    return { status: 'error' };
  } finally {
    clearTimeout(timer);
  }
}
