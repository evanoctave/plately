// =============================================================================
// useDiary — Food diary state hook
// =============================================================================
// Bridges the on-disk SQLite store (`src/db/database.ts`) with the React UI.
//
// Pattern: there is no in-memory cache of diary entries. Instead, screens call
// `useDayLog(day)` which fetches from SQLite and refetches whenever the
// `useDiaryRevision` counter bumps. Any write (add/remove an entry) bumps the
// counter, so every mounted `useDayLog` and any other subscriber reloads.
// This keeps screens in sync without needing a pub/sub layer or a global cache
// of food entries.
//
// Public surface:
//   useDiaryRevision  — the bump-counter store (subscribe to be notified of any change)
//   useDayLog         — entries + totals + loading + reload for a given day
//   logEntry          — add a row to SQLite, then bump
//   removeEntry       — delete a row from SQLite, then bump

import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';

import {
  addEntry,
  deleteEntry,
  getEntriesForDay,
  type FoodEntry,
  type NewEntryInput,
} from '../db/database';
import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';
import { sumNutrition } from '../utils/nutrition';
import { dayKey } from '../utils/date';

interface DiaryState {
  /** Monotonic counter bumped on every write so screens can refetch. */
  revision: number;
  bump: () => void;
}

/**
 * A tiny global "something changed" signal shared across screens. Any screen
 * that wants to react to diary changes subscribes to `revision`. Writers
 * (logEntry / removeEntry) call `bump()` after committing to SQLite.
 */
export const useDiaryRevision = create<DiaryState>((set) => ({
  revision: 0,
  bump: () => set((s) => ({ revision: s.revision + 1 })),
}));

/** Return shape from `useDayLog`. `loading` is only true on the initial fetch. */
export interface DayLog {
  entries: FoodEntry[];
  totals: Nutrition;
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * Loads (and live-reloads) all entries + totals for a given day.
 * Refetches whenever the diary revision bumps. Used by Home, DayDetail, etc.
 *
 * @param day  yyyy-mm-dd key. Defaults to today's local date.
 */
export function useDayLog(day: string = dayKey()): DayLog {
  const revision = useDiaryRevision((s) => s.revision);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [totals, setTotals] = useState<Nutrition>(ZERO_NUTRITION);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getEntriesForDay(day);
      setEntries(rows);
      setTotals(sumNutrition(rows));
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void reload();
  }, [reload, revision]);

  return { entries, totals, loading, reload };
}

/**
 * Add an entry to SQLite. Returns the saved row (with id + createdAt populated).
 * Bumps the revision so every mounted `useDayLog` refetches.
 */
export async function logEntry(input: NewEntryInput): Promise<FoodEntry> {
  const entry = await addEntry(input);
  useDiaryRevision.getState().bump();
  return entry;
}

/** Delete an entry by id. Bumps the revision after the delete commits. */
export async function removeEntry(id: string): Promise<void> {
  await deleteEntry(id);
  useDiaryRevision.getState().bump();
}
