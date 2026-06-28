// =============================================================================
// Navigation types
// =============================================================================
// Source of truth for every route name + the params it accepts. Every screen
// pulls its props off these maps via `RootStackScreenProps<'Foo'>` or
// `TabScreenProps<'Home'>`, which gives strong typing on
// `navigation.navigate(...)` and `route.params`.
//
// To add a new screen:
//   1. Add the route name to `RootStackParamList` (with its params, or
//      `undefined` if it takes none).
//   2. Register the screen in `RootNavigator.tsx`.
//   3. Type the screen component as
//      `({ navigation, route }: RootStackScreenProps<'YourRoute'>) => JSX`.
//
// Tab routes live in `TabParamList`; the tabs themselves are children of the
// `Tabs` stack route.

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

import type { EntrySource } from '../db/database';

/**
 * Every screen the root native stack can show.
 *
 * Onboarding pre-tabs:
 *   Onboarding         — landing / welcome screen
 *   OnboardingFlow     — multi-step Q&A (sex, height, weight, goals, etc.)
 *   GoalResults        — animated "we're setting things up" + computed plan
 *   Auth               — Apple / Google / Email / Guest
 *
 * Main app shell:
 *   Tabs               — the bottom-tab container (Home / Insights / History / Settings)
 *
 * Pushed from inside the app:
 *   Camera             — fullscreen modal for snapping meals
 *   Analyze            — recognizer running on the captured photo
 *   Search             — manual food search
 *   ConfirmFood        — adjust grams + add to diary
 *   DayDetail          — drill-down into one day's log
 *   BarcodeScan        — fullscreen barcode scanner
 *   ...and so on (one entry per screen below).
 */
export type RootStackParamList = {
  Weight: undefined;
  Onboarding: undefined;
  OnboardingFlow: undefined;
  Auth: { mode: 'signup' | 'signin' };
  GoalResults: undefined;
  Tabs: undefined;
  Camera: undefined;
  Analyze: { photoUri: string };
  Search: undefined;
  ConfirmFood: {
    foodId: string;
    photoUri?: string;
    source: EntrySource;
    suggestedGrams?: number;
  };
  DayDetail: { day: string };
  AddCustomFood: undefined;
  MyFoods: undefined;
  BarcodeScan: undefined;
  GoalCalculator: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
  Achievements: undefined;
  RecipeBuilder: undefined;
  Appearance: undefined;
  PlatelyPlus: undefined;
  Fasting: undefined;
  GoalPhases: undefined;
  Coach: undefined;
  MealPlanner: undefined;
};

/** Tabs in the bottom tab bar. All visible after onboarding. */
export type TabParamList = {
  Home: undefined;
  Insights: undefined;
  History: undefined;
  Settings: undefined;
};

/** Props injected into any root stack screen by React Navigation. */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Props for tab screens. The composite shape gives a tab screen access to
 * BOTH the tab navigator (`tabPress`, jumping between tabs) and the parent
 * stack (`navigation.navigate('Camera')` etc.).
 */
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type { EntrySource };
