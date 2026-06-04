import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_GOALS, type Goals } from '../data/nutrients';

export const DEFAULT_ACCENT = '#34C759';

interface SettingsState {
  goals: Goals;
  waterUnit: 'ml' | 'oz'; // display/entry unit
  accent: string; // hex; tints nav + active controls
  appIcon: string; // selected alternate app icon key ('default' = stock)
  plusActive: boolean; // Plately+ subscription unlocked
  onboardingComplete: boolean;
  hydrated: boolean; // persisted settings loaded
  setGoals: (goals: Partial<Goals>) => void;
  setWaterUnit: (unit: 'ml' | 'oz') => void;
  setAccent: (hex: string) => void;
  setAppIcon: (key: string) => void;
  setPlusActive: (active: boolean) => void;
  completeOnboarding: () => void;
  markHydrated: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      goals: DEFAULT_GOALS,
      waterUnit: 'ml',
      accent: DEFAULT_ACCENT,
      appIcon: 'default',
      plusActive: false,
      onboardingComplete: false,
      hydrated: false,
      setGoals: (goals) => set((s) => ({ goals: { ...s.goals, ...goals } })),
      setWaterUnit: (waterUnit) => set({ waterUnit }),
      setAccent: (accent) => set({ accent }),
      setAppIcon: (appIcon) => set({ appIcon }),
      setPlusActive: (plusActive) => set({ plusActive }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'plately-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ goals, waterUnit, accent, appIcon, plusActive, onboardingComplete }) => ({
        goals,
        waterUnit,
        accent,
        appIcon,
        plusActive,
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
