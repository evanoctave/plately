import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_GOALS, type Goals } from '../data/nutrients';

interface SettingsState {
  goals: Goals;
  waterUnit: 'ml' | 'oz'; // display/entry unit
  onboardingComplete: boolean;
  hydrated: boolean; // persisted settings loaded
  setGoals: (goals: Partial<Goals>) => void;
  setWaterUnit: (unit: 'ml' | 'oz') => void;
  completeOnboarding: () => void;
  markHydrated: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      goals: DEFAULT_GOALS,
      waterUnit: 'ml',
      onboardingComplete: false,
      hydrated: false,
      setGoals: (goals) => set((s) => ({ goals: { ...s.goals, ...goals } })),
      setWaterUnit: (waterUnit) => set({ waterUnit }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'plately-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ goals, waterUnit, onboardingComplete }) => ({
        goals,
        waterUnit,
        onboardingComplete,
      }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);

export const ML_PER_OZ = 29.5735;

export function mlToDisplay(ml: number, unit: 'ml' | 'oz'): number {
  return unit === 'oz' ? Math.round(ml / ML_PER_OZ) : Math.round(ml);
}

export function displayToMl(value: number, unit: 'ml' | 'oz'): number {
  return unit === 'oz' ? value * ML_PER_OZ : value;
}
