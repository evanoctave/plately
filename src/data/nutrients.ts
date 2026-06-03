// Nutrient model. Food values are per 100 g of edible portion (USDA FoodData
// Central). Daily Values follow U.S. FDA labels (2,000 kcal reference adult).

export interface Macros {
  calories: number; // kcal
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
}

export interface Micros {
  sodium: number; // mg
  potassium: number; // mg
  calcium: number; // mg
  iron: number; // mg
  magnesium: number; // mg
  vitaminA: number; // µg RAE
  vitaminC: number; // mg
  vitaminD: number; // µg
}

export interface Nutrition extends Macros, Micros {
  water: number; // g
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
  dailyValue: number; // FDA Daily Value
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

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // mL/day
}

export const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 100,
  carbs: 250,
  fat: 65,
  water: 2500,
};
