// Local gamification. All progress derives from on-device diary data — no
// account, no server, no tracking. Pure functions so they stay unit-testable.

import { differenceInCalendarDays, parseISO } from 'date-fns';

export type AchievementCategory = 'streak' | 'logging' | 'hydration' | 'creation';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
  category: AchievementCategory;
  goal: number;
  metric: keyof AchievementStats;
}

export interface AchievementStats {
  totalEntries: number;
  loggedDaysCount: number;
  currentStreak: number;
  longestStreak: number;
  customFoodsCount: number;
  waterGoalDays: number;
}

export interface AchievementProgress extends Achievement {
  current: number;
  unlocked: boolean;
  pct: number; // 0..1
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-bite', title: 'First Bite', description: 'Log your very first food', icon: 'restaurant', category: 'logging', goal: 1, metric: 'totalEntries' },
  { id: 'fifty-logs', title: 'Getting Consistent', description: 'Log 50 foods', icon: 'list', category: 'logging', goal: 50, metric: 'totalEntries' },
  { id: 'five-hundred-logs', title: 'Tracking Pro', description: 'Log 500 foods', icon: 'ribbon', category: 'logging', goal: 500, metric: 'totalEntries' },
  { id: 'streak-3', title: 'Warming Up', description: '3-day logging streak', icon: 'flame', category: 'streak', goal: 3, metric: 'longestStreak' },
  { id: 'streak-7', title: 'One Week Strong', description: '7-day logging streak', icon: 'flame', category: 'streak', goal: 7, metric: 'longestStreak' },
  { id: 'streak-30', title: 'Unstoppable', description: '30-day logging streak', icon: 'flame', category: 'streak', goal: 30, metric: 'longestStreak' },
  { id: 'streak-100', title: 'Centurion', description: '100-day logging streak', icon: 'trophy', category: 'streak', goal: 100, metric: 'longestStreak' },
  { id: 'days-30', title: 'Monthly Habit', description: 'Log on 30 different days', icon: 'calendar', category: 'logging', goal: 30, metric: 'loggedDaysCount' },
  { id: 'hydrate-7', title: 'Hydrated', description: 'Hit your water goal 7 times', icon: 'water', category: 'hydration', goal: 7, metric: 'waterGoalDays' },
  { id: 'hydrate-30', title: 'Water Champion', description: 'Hit your water goal 30 times', icon: 'water', category: 'hydration', goal: 30, metric: 'waterGoalDays' },
  { id: 'chef-1', title: 'Home Cook', description: 'Create your first custom food', icon: 'create', category: 'creation', goal: 1, metric: 'customFoodsCount' },
  { id: 'chef-10', title: 'Recipe Collector', description: 'Create 10 custom foods', icon: 'create', category: 'creation', goal: 10, metric: 'customFoodsCount' },
];

export function computeAchievements(stats: AchievementStats): AchievementProgress[] {
  return ACHIEVEMENTS.map((a) => {
    const current = stats[a.metric];
    const pct = a.goal === 0 ? 1 : Math.min(1, current / a.goal);
    return { ...a, current, unlocked: current >= a.goal, pct };
  });
}

// Longest run of consecutive calendar days present in the set.
export function longestStreak(loggedDays: Iterable<string>): number {
  const days = [...new Set(loggedDays)].sort();
  if (days.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = differenceInCalendarDays(parseISO(days[i]!), parseISO(days[i - 1]!));
    if (gap === 1) run += 1;
    else if (gap > 1) run = 1;
    // gap === 0 (duplicate) shouldn't happen after de-dupe; ignore.
    if (run > best) best = run;
  }
  return best;
}

// One streak-freeze earned per full week of best streak — a small reward that
// (conceptually) protects a streak. Kept derived so there's no state to sync.
export function freezeTokens(longest: number): number {
  return Math.floor(longest / 7);
}
