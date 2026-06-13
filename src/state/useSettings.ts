import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_GOALS, type Goals } from '../data/nutrients';

export const DEFAULT_ACCENT = '#7370FA';

interface SettingsState {
  goals: Goals;
  waterUnit: 'ml' | 'oz'; // display/entry unit
  weightUnit: 'kg' | 'lb'; // display/entry unit
  accent: string; // hex; tints nav + active controls
  appIcon: string; // selected alternate app icon key ('default' = stock)
  plusActive: boolean; // Plately+ subscription unlocked
  onboardingComplete: boolean;
  hydrated: boolean; // persisted settings loaded
  setGoals: (goals: Partial<Goals>) => void;
  setWaterUnit: (unit: 'ml' | 'oz') => void;
  setWeightUnit: (unit: 'kg' | 'lb') => void;
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
      weightUnit: 'kg',
      accent: DEFAULT_ACCENT,
      appIcon: 'default',
      plusActive: false,
      onboardingComplete: false,
      hydrated: false,
      setGoals: (goals) => set((s) => ({ goals: { ...s.goals, ...goals } })),
      setWaterUnit: (waterUnit) => set({ waterUnit }),
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setAccent: (accent) => set({ accent }),
      setAppIcon: (appIcon) => set({ appIcon }),
      setPlusActive: (plusActive) => set({ plusActive }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'plately-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ goals, waterUnit, weightUnit, accent, appIcon, plusActive, onboardingComplete }) => ({
        goals,
        waterUnit,
        weightUnit,
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
export const KG_PER_LB = 0.45359237;

export function kgToDisplay(kg: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? kg / KG_PER_LB : kg;
}

export function displayToKg(value: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? value * KG_PER_LB : value;
}

export function mlToDisplay(ml: number, unit: 'ml' | 'oz'): number {
  return unit === 'oz' ? Math.round(ml / ML_PER_OZ) : Math.round(ml);
}

export function displayToMl(value: number, unit: 'ml' | 'oz'): number {
  return unit === 'oz' ? value * ML_PER_OZ : value;
}
