// Barcode → food lookup via Open Food Facts (free, key-less). Lookups fail soft.

import { ZERO_NUTRITION, type Nutrition } from './nutrients';
import type { FoodItem } from './foods';

export const OFF_PREFIX = 'off:';

const ENDPOINT = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS =
  'product_name,brands,serving_quantity,nutriments';
const TIMEOUT_MS = 8000;

interface OffNutriments {
  ['energy-kcal_100g']?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  sodium_100g?: number; // g per 100 g
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

// Maps an OFF product to a per-100g FoodItem; null if it lacks name/nutrition.
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

// Fetches and maps a product by barcode. Never throws.
export async function lookupBarcode(barcode: string): Promise<BarcodeLookup> {
  // Only digits, GTIN-range length. Rejects malformed/oversized scanner input
  // before it ever reaches the network.
  const code = barcode.replace(/\D/g, '');
  if (code.length < 6 || code.length > 14) return { status: 'not_found' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ENDPOINT}/${encodeURIComponent(code)}.json?fields=${FIELDS}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Plately/1.0 (open-source nutrition app)' },
    });
    if (!res.ok) return { status: 'error' };
    const data = (await res.json()) as OffResponse;
    if (data.status !== 1 || !data.product) return { status: 'not_found' };
    const food = mapProductToFood(code, data.product);
    return food ? { status: 'found', food } : { status: 'not_found' };
  } catch {
    return { status: 'error' };
  } finally {
    clearTimeout(timer);
  }
}
