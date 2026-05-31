/**
 * Canonical nutrient model used throughout the app.
 *
 * All values in the bundled food database (`foods.json`) are expressed
 * **per 100 g of edible portion**, matching the convention used by the USDA
 * FoodData Central public-domain dataset that the values are derived from.
 *
 * Reference Daily Values (RDV) below follow the U.S. FDA Daily Values used on
 * Nutrition Facts labels (2,000 kcal reference adult). They are used only to
 * render "% of daily goal" context and are not medical advice.
 */

export interface Macros {
  /** kilocalories */
  calories: number;
  /** grams */
  protein: number;
  /** grams */
  carbs: number;
  /** grams */
  fat: number;
  /** grams */
  fiber: number;
  /** grams */
  sugar: number;
}

export interface Micros {
  /** milligrams */
  sodium: number;
  /** milligrams */
  potassium: number;
  /** milligrams */
  calcium: number;
  /** milligrams */
  iron: number;
  /** milligrams */
  magnesium: number;
  /** micrograms RAE */
  vitaminA: number;
  /** milligrams */
  vitaminC: number;
  /** micrograms */
  vitaminD: number;
}

/** A complete nutrition profile for a quantity of food. */
export interface Nutrition extends Macros, Micros {
  /** grams of water */
  water: number;
}

export const ZERO_NUTRITION: Nutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  potassium: 0,
  calcium: 0,
  iron: 0,
  magnesium: 0,
  vitaminA: 0,
  vitaminC: 0,
  vitaminD: 0,
  water: 0,
};

export type MicroKey = keyof Micros;

export interface MicroMeta {
  key: MicroKey;
  label: string;
  unit: string;
  /** FDA Daily Value used for % context. */
  dailyValue: number;
}

export const MICRO_META: MicroMeta[] = [
  { key: 'sodium', label: 'Sodium', unit: 'mg', dailyValue: 2300 },
  { key: 'potassium', label: 'Potassium', unit: 'mg', dailyValue: 4700 },
  { key: 'calcium', label: 'Calcium', unit: 'mg', dailyValue: 1300 },
  { key: 'iron', label: 'Iron', unit: 'mg', dailyValue: 18 },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', dailyValue: 420 },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'µg', dailyValue: 900 },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', dailyValue: 90 },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'µg', dailyValue: 20 },
];

/** Default daily goals (editable in Settings). */
export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** milliliters of water per day */
  water: number;
}

export const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 100,
  carbs: 250,
  fat: 65,
  water: 2500,
};
