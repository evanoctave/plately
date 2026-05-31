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

/** A tiny global "something changed" signal shared across screens. */
export const useDiaryRevision = create<DiaryState>((set) => ({
  revision: 0,
  bump: () => set((s) => ({ revision: s.revision + 1 })),
}));

export interface DayLog {
  entries: FoodEntry[];
  totals: Nutrition;
  loading: boolean;
  reload: () => Promise<void>;
}

/** Loads (and live-reloads) all entries + totals for a given day. */
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

export async function logEntry(input: NewEntryInput): Promise<FoodEntry> {
  const entry = await addEntry(input);
  useDiaryRevision.getState().bump();
  return entry;
}

export async function removeEntry(id: string): Promise<void> {
  await deleteEntry(id);
  useDiaryRevision.getState().bump();
}
