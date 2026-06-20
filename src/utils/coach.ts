// =============================================================================
// utils/coach — Heuristic tips for the Smart Coach screen
// =============================================================================
// Generates short, contextual tips ("You're low on protein today", "Hydration
// behind schedule", etc.) from the user's day-so-far totals + goals. Output is
// a list of `CoachTip` objects with a tone, icon, title, and one-line detail.
//
// Pure / synchronous so it can be re-evaluated on every diary change without
// performance worries. Tone (`good` / `warn` / `info`) drives icon + accent
// color on the Smart Coach screen.

import type { Goals, Nutrition } from '../data/nutrients';

export type CoachTone = 'good' | 'warn' | 'info';

export interface CoachTip {
  id: string;
  tone: CoachTone;
  icon: string; // Ionicons name
  title: string;
  detail: string;
}

export interface CoachInput {
  totals: Nutrition;
  goals: Goals;
  itemCount: number; // non-water entries logged today
}

// Soft daily reference targets the app doesn't expose as editable goals.
const FIBER_TARGET_G = 28;
const SUGAR_LIMIT_G = 50;
const SODIUM_LIMIT_MG = 2300;

function pct(value: number, target: number): number {
  return target > 0 ? value / target : 0;
}

/**
 * Rule-based daily guidance derived entirely from today's logged totals and the
 * user's goals. No network, no model — deterministic so it can be unit-tested.
 * Returns tips ordered: warnings first, then info, then positive reinforcement.
 */
export function buildCoachTips({ totals, goals, itemCount }: CoachInput): CoachTip[] {
  if (itemCount === 0) {
    return [
      {
        id: 'empty',
        tone: 'info',
        icon: 'restaurant-outline',
        title: 'Nothing logged yet',
        detail: 'Log a meal and your Coach will spot gaps and wins in your day.',
      },
    ];
  }

  const tips: CoachTip[] = [];

  // Protein
  const proteinPct = pct(totals.protein, goals.protein);
  const proteinGap = Math.round(goals.protein - totals.protein);
  if (goals.protein > 0 && proteinPct < 0.7) {
    tips.push({
      id: 'protein-low',
      tone: 'warn',
      icon: 'barbell-outline',
      title: `${Math.max(0, proteinGap)} g protein to go`,
      detail: 'You are well under your protein target. A lean meat, Greek yogurt or a shake closes the gap.',
    });
  }

  // Calories over
  const calPct = pct(totals.calories, goals.calories);
  if (goals.calories > 0 && calPct > 1.1) {
    const over = Math.round(totals.calories - goals.calories);
    tips.push({
      id: 'cal-over',
      tone: 'warn',
      icon: 'flame-outline',
      title: `${over} kcal over goal`,
      detail: 'You have passed your calorie target for today. Lighter choices from here will keep you on track.',
    });
  }

  // Sugar
  if (totals.sugar > SUGAR_LIMIT_G) {
    tips.push({
      id: 'sugar-high',
      tone: 'warn',
      icon: 'ice-cream-outline',
      title: `${Math.round(totals.sugar)} g sugar today`,
      detail: 'Sugar is running high. Swapping a sweet snack for fruit or nuts helps balance it out.',
    });
  }

  // Sodium
  if (totals.sodium > SODIUM_LIMIT_MG) {
    tips.push({
      id: 'sodium-high',
      tone: 'warn',
      icon: 'water-outline',
      title: `${Math.round(totals.sodium)} mg sodium`,
      detail: 'Sodium is above the daily reference. Go easy on processed and salty foods for the rest of the day.',
    });
  }

  // Water
  const waterPct = pct(totals.water, goals.water);
  if (goals.water > 0 && waterPct < 0.6) {
    tips.push({
      id: 'water-low',
      tone: 'info',
      icon: 'water',
      title: 'Hydration is behind',
      detail: 'You are under 60% of your water goal. A glass or two now keeps you on pace.',
    });
  }

  // Fiber
  if (itemCount >= 2 && totals.fiber < FIBER_TARGET_G * 0.6) {
    tips.push({
      id: 'fiber-low',
      tone: 'info',
      icon: 'leaf-outline',
      title: 'Low on fiber',
      detail: 'Add vegetables, beans, oats or fruit to reach a fuller, more satisfying day.',
    });
  }

  // Calories under (only worth saying once there is a real day logged)
  if (goals.calories > 0 && itemCount >= 2 && calPct < 0.6) {
    const under = Math.round(goals.calories - totals.calories);
    tips.push({
      id: 'cal-under',
      tone: 'info',
      icon: 'add-circle-outline',
      title: `${under} kcal of room left`,
      detail: 'You are eating well under your goal. Make sure you are fuelling enough for the day.',
    });
  }

  // Positive reinforcement
  if (proteinPct >= 1 && calPct >= 0.85 && calPct <= 1.1) {
    tips.push({
      id: 'on-track',
      tone: 'good',
      icon: 'checkmark-circle',
      title: 'Dialed in',
      detail: 'Protein is on point and calories are right in your target zone. Great day.',
    });
  } else if (proteinPct >= 1) {
    tips.push({
      id: 'protein-hit',
      tone: 'good',
      icon: 'checkmark-circle',
      title: 'Protein goal hit',
      detail: 'You have met your protein target — the foundation of a strong day.',
    });
  }

  const order: Record<CoachTone, number> = { warn: 0, info: 1, good: 2 };
  return tips.sort((a, b) => order[a.tone] - order[b.tone]);
}
