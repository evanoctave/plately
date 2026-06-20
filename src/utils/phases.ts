// =============================================================================
// utils/phases — Goal phase metadata + math
// =============================================================================
// Each `PhaseKind` ("cut" / "maintain" / "bulk") has a default calorie
// multiplier relative to the maintenance baseline plus suggested macro split.
// Used by the GoalPhases screen to seed new phases and to compute the
// effective `Goals` payload when a phase is selected as active.

import type { Goals } from '../data/nutrients';
import type { PhaseKind } from '../db/phases';

export interface PhaseKindMeta {
  kind: PhaseKind;
  label: string;
  blurb: string;
  icon: string;
  /** Calorie multiplier applied to the base maintenance goal. */
  calorieFactor: number;
  /** Protein multiplier (cuts/bulks lean on protein). */
  proteinFactor: number;
}

export const PHASE_KINDS: PhaseKindMeta[] = [
  { kind: 'cut', label: 'Cut', blurb: 'Lose fat — lower calories, protein held high', icon: 'trending-down', calorieFactor: 0.8, proteinFactor: 1.1 },
  { kind: 'maintain', label: 'Maintain', blurb: 'Hold steady at your current targets', icon: 'remove', calorieFactor: 1, proteinFactor: 1 },
  { kind: 'bulk', label: 'Bulk', blurb: 'Build muscle — a calorie surplus', icon: 'trending-up', calorieFactor: 1.15, proteinFactor: 1.05 },
];

export function phaseMeta(kind: PhaseKind): PhaseKindMeta {
  return PHASE_KINDS.find((p) => p.kind === kind) ?? PHASE_KINDS[1]!;
}

/**
 * Derives phase targets from a base (maintenance) goal. Calories scale by the
 * phase factor; protein is preserved/raised; fat is pinned to ~25% of energy;
 * carbs take the remainder. Water carries over unchanged.
 */
export function buildPhaseGoals(base: Goals, kind: PhaseKind): Goals {
  const meta = phaseMeta(kind);
  const calories = Math.round((base.calories * meta.calorieFactor) / 10) * 10;
  const protein = Math.round(base.protein * meta.proteinFactor);
  const fat = Math.round((calories * 0.25) / 9);
  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const carbs = Math.max(0, Math.round((calories - proteinKcal - fatKcal) / 4));
  return { calories, protein, carbs, fat, water: base.water };
}
