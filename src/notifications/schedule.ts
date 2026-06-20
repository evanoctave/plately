// =============================================================================
// notifications/schedule — Pure reminder schedule builder
// =============================================================================
// Turns the user's reminder preferences into a flat list of daily repeating
// notifications. No native calls here, so it's unit-tested; notifications.ts
// takes this list and registers it with expo-notifications.

export interface ReminderPrefs {
  enabled: boolean;
  meals: boolean;   // breakfast / lunch / dinner log nudges
  water: boolean;   // mid-afternoon hydration nudge
  streak: boolean;  // evening "log before the day ends" nudge
}

export const DEFAULT_REMINDERS: ReminderPrefs = {
  enabled: false,
  meals: true,
  water: true,
  streak: true,
};

/** One daily repeating notification. `key` is stable so we can de-dupe. */
export interface ScheduledReminder {
  key: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
}

const MEAL_REMINDERS: ScheduledReminder[] = [
  { key: 'meal-breakfast', title: 'Breakfast logged?', body: 'Start the day on track — add your breakfast.', hour: 9, minute: 0 },
  { key: 'meal-lunch', title: 'Lunch time', body: 'Snap or search your lunch to keep the streak going.', hour: 13, minute: 0 },
  { key: 'meal-dinner', title: 'Dinner check-in', body: 'Round out your day — log dinner.', hour: 19, minute: 30 },
];

const WATER_REMINDER: ScheduledReminder = {
  key: 'water-afternoon', title: 'Hydration check', body: 'How’s your water today? Tap to add a glass.', hour: 15, minute: 0,
};

const STREAK_REMINDER: ScheduledReminder = {
  key: 'streak-evening', title: 'Keep your streak alive', body: 'Log anything before midnight to keep your streak.', hour: 20, minute: 45,
};

/** Build the full set of reminders to schedule. Empty when disabled. */
export function buildSchedule(prefs: ReminderPrefs): ScheduledReminder[] {
  if (!prefs.enabled) return [];
  const out: ScheduledReminder[] = [];
  if (prefs.meals) out.push(...MEAL_REMINDERS);
  if (prefs.water) out.push(WATER_REMINDER);
  if (prefs.streak) out.push(STREAK_REMINDER);
  return out;
}
