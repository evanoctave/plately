// =============================================================================
// useSettings — Persistent user settings & profile (Zustand store)
// =============================================================================
// The single source of truth for everything the user configures or that we
// remember about them between launches: nutrition goals, unit preferences,
// the chosen accent color, onboarding completion, the answers from the Q&A,
// and the linked account (if any).
//
// Persistence:
//   Powered by Zustand's `persist` middleware backed by AsyncStorage.
//   The `partialize` function whitelists which fields survive a restart — the
//   ephemeral `hydrated` flag is intentionally excluded.
//
// Hydration:
//   On app start, AsyncStorage reads happen asynchronously. App.tsx blocks on
//   `hydrated` (set by `onRehydrateStorage` once rehydration finishes) before
//   rendering the navigator, so the UI never flashes the default values.
//
// Unit helpers at the bottom convert between metric (the canonical storage
// unit) and the user's display preference.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_GOALS, type Goals } from '../data/nutrients';
import type { Sex, ActivityLevel, GoalDirection } from '../utils/goals';
import { DEFAULT_REMINDERS, type ReminderPrefs } from '../notifications/schedule';

/** Default accent color (emerald). Used both as a fallback and as the seed value for new users. */
export const DEFAULT_ACCENT = '#16A34A';

/**
 * Everything we learn about the user during onboarding.
 * Stored canonically in metric. UI converts on display via the helpers below.
 * Fields are optional because the questionnaire can be skipped.
 */
export interface UserProfile {
  sex?: Sex | 'other';
  birthYear?: number;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  activity?: ActivityLevel;
  workoutsPerWeek?: 0 | 1 | 2;                // 0-2 | 3-5 | 6+ (index into WORKOUT_BUCKETS)
  goalDirection?: GoalDirection;
  speedLbsPerWeek?: number;
  diet?: string;
  obstacles?: string[];
  referralSource?: string;
  triedOtherApps?: boolean;
  hasTrainer?: boolean;
  notificationsEnabled?: boolean;
}

/**
 * Identity of whoever's signed in. `provider` is the auth method used; `guest`
 * means the user chose "skip — use without an account". Email is captured for
 * email sign-up and read back from Apple/Google providers when available.
 */
export interface AccountInfo {
  email?: string;
  name?: string;
  provider?: 'apple' | 'google' | 'email' | 'guest';
}

/** Shape of the Zustand store. Public actions live alongside the data they mutate. */
interface SettingsState {
  goals: Goals;
  waterUnit: 'ml' | 'oz'; // display/entry unit
  weightUnit: 'kg' | 'lb'; // display/entry unit
  accent: string; // hex; tints nav + active controls
  appIcon: string; // selected alternate app icon key ('default' = stock)
  plusActive: boolean; // EvoEat+ subscription unlocked
  darkMode: boolean; // dark color scheme
  onboardingComplete: boolean;
  profile: UserProfile;
  account: AccountInfo | null;
  reminders: ReminderPrefs; // local notification preferences
  hydrated: boolean; // persisted settings loaded
  setGoals: (goals: Partial<Goals>) => void;
  setWaterUnit: (unit: 'ml' | 'oz') => void;
  setWeightUnit: (unit: 'kg' | 'lb') => void;
  setAccent: (hex: string) => void;
  setAppIcon: (key: string) => void;
  setPlusActive: (active: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setAccount: (account: AccountInfo | null) => void;
  setReminders: (patch: Partial<ReminderPrefs>) => void;
  completeOnboarding: () => void;
  markHydrated: () => void;
}

/**
 * Main hook. Subscribe selectively with a selector to avoid re-rendering on
 * unrelated changes:
 *
 *   const accent = useSettings((s) => s.accent);    // re-renders only when accent changes
 *   const setGoals = useSettings((s) => s.setGoals); // stable reference, never re-renders
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      goals: DEFAULT_GOALS,
      waterUnit: 'ml',
      weightUnit: 'kg',
      accent: DEFAULT_ACCENT,
      appIcon: 'default',
      plusActive: false,
      darkMode: false,
      onboardingComplete: false,
      profile: {},
      account: null,
      reminders: DEFAULT_REMINDERS,
      hydrated: false,
      setGoals: (goals) => set((s) => ({ goals: { ...s.goals, ...goals } })),
      setWaterUnit: (waterUnit) => set({ waterUnit }),
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setAccent: (accent) => set({ accent }),
      setAppIcon: (appIcon) => set({ appIcon }),
      setPlusActive: (plusActive) => set({ plusActive }),
      setDarkMode: (darkMode) => set({ darkMode }),
      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      setAccount: (account) => set({ account }),
      setReminders: (patch) => set((s) => ({ reminders: { ...s.reminders, ...patch } })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      // AsyncStorage key. Bump on a breaking schema change to force a clean slate.
      name: 'plately-settings',
      storage: createJSONStorage(() => AsyncStorage),
      // `partialize` whitelists what gets persisted; transient fields stay in memory.
      partialize: ({
        goals, waterUnit, weightUnit, accent, appIcon, plusActive, darkMode, onboardingComplete, profile, account, reminders,
      }) => ({
        goals, waterUnit, weightUnit, accent, appIcon, plusActive, darkMode, onboardingComplete, profile, account, reminders,
      }),
      // Fires once AsyncStorage has finished filling the store. Signals to App.tsx
      // that it's safe to render the real UI.
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);

// -----------------------------------------------------------------------------
// Unit conversion helpers
// -----------------------------------------------------------------------------
// Internally we store everything in metric (mL, kg). These helpers let UI code
// flip to the user's preferred unit on read, and back to metric on write.

export const ML_PER_OZ = 29.5735;
export const KG_PER_LB = 0.45359237;

/** kg → kg or lb (rounded by caller as needed). */
export function kgToDisplay(kg: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? kg / KG_PER_LB : kg;
}

/** User-entered kg/lb → canonical kg. */
export function displayToKg(value: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? value * KG_PER_LB : value;
}

/** mL → mL or oz (oz rounded to int to match the typical input granularity). */
export function mlToDisplay(ml: number, unit: 'ml' | 'oz'): number {
  return unit === 'oz' ? Math.round(ml / ML_PER_OZ) : Math.round(ml);
}

/** User-entered mL/oz → canonical mL. */
export function displayToMl(value: number, unit: 'ml' | 'oz'): number {
  return unit === 'oz' ? value * ML_PER_OZ : value;
}
