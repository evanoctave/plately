// =============================================================================
// useFasting — Intermittent fasting state hook
// =============================================================================
// Tracks the currently active fast (at most one at a time) plus a list of
// recent completed fasts. Backed by SQLite via `src/db/fasting.ts`.
//
// Unlike the diary store (which uses a bump-counter), this store holds the
// fasting data in memory after first load. Mutations (`start` / `stop` /
// `remove`) write to SQLite and then refresh the in-memory copy. Screens
// subscribe through the normal Zustand pattern.

import { useEffect } from 'react';
import { create } from 'zustand';

import {
  deleteFast,
  endFast,
  getActiveFast,
  getRecentFasts,
  startFast,
  type FastSession,
} from '../db/fasting';
import { dayKey } from '../utils/date';

interface FastingState {
  active: FastSession | null;
  recent: FastSession[];
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  start: (targetHours: number) => Promise<void>;
  stop: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * Zustand store with fasting state + actions. Don't call `start`/`stop` from
 * multiple places concurrently — there's no lock; the assumption is that the
 * UI gates these via a single button.
 */
export const useFasting = create<FastingState>((set, get) => ({
  active: null,
  recent: [],
  loading: false,
  loaded: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const [active, recent] = await Promise.all([getActiveFast(), getRecentFasts()]);
      set({ active, recent, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  start: async (targetHours) => {
    await startFast(targetHours, dayKey());
    await get().refresh();
  },
  stop: async () => {
    const active = get().active;
    if (!active) return;
    await endFast(active.id);
    await get().refresh();
  },
  remove: async (id) => {
    await deleteFast(id);
    await get().refresh();
  },
}));

/**
 * Convenience hook for screens — lazy-loads the fasting data on first mount,
 * then returns the live store value. Use this instead of `useFasting()`
 * directly when the screen needs the data eagerly.
 */
export function useFastingData(): FastingState {
  const state = useFasting();
  useEffect(() => {
    if (!state.loaded) void state.refresh();
  }, [state.loaded, state.refresh]);
  return state;
}
