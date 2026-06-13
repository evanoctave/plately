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

/** Loads fasting data once when a screen mounts. */
export function useFastingData(): FastingState {
  const state = useFasting();
  useEffect(() => {
    if (!state.loaded) void state.refresh();
  }, [state.loaded, state.refresh]);
  return state;
}
