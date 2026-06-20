// =============================================================================
// utils/goals — Calorie & macro goal calculator
// =============================================================================
// Implements the standard Mifflin–St Jeor BMR equation, multiplies by an
// activity factor to get TDEE, then applies a calorie delta for the goal
// direction (lose / maintain / gain). Macros are split using common defaults:
//   ~30% protein, ~40% carbs, ~30% fat (tweakable inside `computeGoals`).
//
// Used by:
//   - OnboardingFlow (final step computes initial goals)
//   - GoalCalculator (manual recompute screen in Settings)
//
// Output is general wellness math, not medical/clinical advice. The user can
// always override the numbers manually from the Settings screen.

import type { Goals } from '../data/nutrients';

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type GoalDirection = 'lose' | 'maintain' | 'gain';

export interface GoalInputs {
  sex: Sex;
  age: number; // years
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  direction: GoalDirection;
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little exercise)',
  light: 'Light (1–3 days/week)',
  moderate: 'Moderate (3–5 days/week)',
  active: 'Active (6–7 days/week)',
  very_active: 'Very active (hard daily / physical job)',
};

export const DIRECTION_LABELS: Record<GoalDirection, string> = {
  lose: 'Lose weight',
  maintain: 'Maintain',
  gain: 'Gain muscle',
};

// ±15% of maintenance for cut/bulk.
const DIRECTION_FACTORS: Record<GoalDirection, number> = {
  lose: 0.85,
  maintain: 1.0,
  gain: 1.15,
};

// Mifflin–St Jeor BMR (kcal/day).
export function bmr(inputs: Pick<GoalInputs, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  const base = 10 * inputs.weightKg + 6.25 * inputs.heightCm - 5 * inputs.age;
  return inputs.sex === 'male' ? base + 5 : base - 161;
}

// TDEE = BMR × activity factor (kcal/day).
export function tdee(inputs: GoalInputs): number {
  return bmr(inputs) * ACTIVITY_FACTORS[inputs.activity];
}

// Protein 1.6 g/kg (1.8 for gain), fat 25% of kcal, carbs the remainder,
// water 35 mL/kg.
export function computeGoals(inputs: GoalInputs): Goals {
  const calories = Math.round(tdee(inputs) * DIRECTION_FACTORS[inputs.direction]);

  const proteinPerKg = inputs.direction === 'gain' ? 1.8 : 1.6;
  const protein = Math.round(inputs.weightKg * proteinPerKg);

  const fat = Math.round((calories * 0.25) / 9);

  const remaining = calories - (protein * 4 + fat * 9);
  const carbs = Math.max(0, Math.round(remaining / 4));

  const water = Math.round(inputs.weightKg * 35);

  return { calories, protein, carbs, fat, water };
}

// --- unit helpers ---

export const LB_PER_KG = 2.20462;
export const CM_PER_IN = 2.54;

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}
export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}
export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}
export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_IN;
}
