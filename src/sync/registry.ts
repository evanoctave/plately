// =============================================================================
// sync/registry — Which local tables sync, and how
// =============================================================================
// One entry per SQLite table we replicate to Supabase. The sync engine is
// fully generic: it reads these descriptors to build triggers, push dirty
// rows, and apply pulled rows. Adding a new synced table = adding a row here
// (plus the matching Supabase table in supabase/migrations).
//
// `pk` is the single-column primary key. `columns` lists the data columns
// (everything except the pk). Both the local and remote tables must carry
// exactly `pk` + `columns`; the engine appends the bookkeeping columns
// (`updated_at`, `deleted`, `user_id`) itself.

import { ensureReady as ensureEntries } from '../db/database';
import { ensureReady as ensureWeights } from '../db/weights';
import { ensureReady as ensureCustomFoods } from '../db/customFoods';
import { ensureReady as ensureFavorites } from '../db/favorites';
import { ensureReady as ensureFasting } from '../db/fasting';
import { ensureReady as ensureMealPlan } from '../db/mealPlan';
import { ensureReady as ensurePhases } from '../db/phases';

/** The 15 nutrition snapshot columns shared by entries / custom foods / plan items. */
const NUTRITION = [
  'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar',
  'sodium', 'potassium', 'calcium', 'iron', 'magnesium',
  'vitaminA', 'vitaminC', 'vitaminD', 'water',
] as const;

export interface SyncTable {
  /** SQLite + Supabase table name (kept identical on both sides). */
  name: string;
  /** Single-column primary key. */
  pk: string;
  /** Data columns (excludes the pk and all bookkeeping columns). */
  columns: string[];
  /** Guarantees the local table exists before sync touches it. */
  ensureReady: () => Promise<void>;
}

export const SYNC_TABLES: SyncTable[] = [
  {
    name: 'entries',
    pk: 'id',
    columns: ['day', 'createdAt', 'foodId', 'name', 'grams', 'photoUri', 'source', ...NUTRITION],
    ensureReady: ensureEntries,
  },
  {
    name: 'weights',
    pk: 'day',
    columns: ['kg', 'createdAt'],
    ensureReady: ensureWeights,
  },
  {
    name: 'custom_foods',
    pk: 'id',
    columns: ['name', 'category', 'servingGrams', 'servingLabel', 'createdAt', ...NUTRITION],
    ensureReady: ensureCustomFoods,
  },
  {
    name: 'favorites',
    pk: 'foodId',
    columns: ['createdAt'],
    ensureReady: ensureFavorites,
  },
  {
    name: 'fasting_sessions',
    pk: 'id',
    columns: ['startedAt', 'endedAt', 'targetHours', 'day'],
    ensureReady: ensureFasting,
  },
  {
    name: 'plan_items',
    pk: 'id',
    columns: ['day', 'foodId', 'name', 'grams', 'createdAt', ...NUTRITION],
    ensureReady: ensureMealPlan,
  },
  {
    name: 'goal_phases',
    pk: 'id',
    columns: ['name', 'kind', 'calories', 'protein', 'carbs', 'fat', 'water', 'active', 'createdAt'],
    ensureReady: ensurePhases,
  },
];

/** All columns a row carries locally: pk first, then the data columns. */
export function dataColumns(t: SyncTable): string[] {
  return [t.pk, ...t.columns];
}
