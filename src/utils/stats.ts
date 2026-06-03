import { format, subDays } from 'date-fns';

import { dayKey } from './date';

// Last n day-keys ending today, oldest first.
export function lastNDays(n: number, today: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(dayKey(subDays(today, i)));
  }
  return out;
}

// Mean (0 for empty).
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

// Consecutive logged days ending today (or yesterday, so the streak doesn't
// break before you've eaten today).
export function computeStreak(loggedDays: Iterable<string>, today: Date = new Date()): number {
  const set = loggedDays instanceof Set ? loggedDays : new Set(loggedDays);
  if (set.size === 0) return 0;

  let cursor = today;
  if (!set.has(format(today, 'yyyy-MM-dd'))) {
    cursor = subDays(today, 1);
    if (!set.has(format(cursor, 'yyyy-MM-dd'))) return 0;
  }

  let streak = 0;
  while (set.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function weekdayShort(key: string): string {
  return format(new Date(`${key}T00:00:00`), 'EEEEE');
}

export function dayOfMonth(key: string): string {
  return format(new Date(`${key}T00:00:00`), 'd');
}
