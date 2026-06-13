import { differenceInCalendarDays } from 'date-fns';

import type { FastSession } from '../db/fasting';
import { clamp01 } from './nutrition';

export interface FastProtocol {
  key: string;
  label: string;
  fastHours: number;
  blurb: string;
}

// Common intermittent-fasting schedules. `fastHours` is the fasting window.
export const FAST_PROTOCOLS: FastProtocol[] = [
  { key: '16:8', label: '16:8', fastHours: 16, blurb: 'Fast 16h · eat 8h' },
  { key: '18:6', label: '18:6', fastHours: 18, blurb: 'Fast 18h · eat 6h' },
  { key: '20:4', label: '20:4', fastHours: 20, blurb: 'Warrior · eat 4h' },
  { key: 'omad', label: 'OMAD', fastHours: 23, blurb: 'One meal a day' },
];

export const HOUR_MS = 3_600_000;

/** Elapsed hours of a fast as of `now`. */
export function elapsedHours(session: Pick<FastSession, 'startedAt' | 'endedAt'>, now = Date.now()): number {
  const end = session.endedAt ?? now;
  return Math.max(0, (end - session.startedAt) / HOUR_MS);
}

/** Progress toward the target window, clamped to [0,1]. */
export function fastProgress(session: Pick<FastSession, 'startedAt' | 'endedAt' | 'targetHours'>, now = Date.now()): number {
  if (session.targetHours <= 0) return 0;
  return clamp01(elapsedHours(session, now) / session.targetHours);
}

/** "16h 32m" style label from a number of hours. */
export function formatHoursLabel(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/** "16:00:00" countdown for the live timer. */
export function formatCountdown(hours: number): string {
  const totalSeconds = Math.max(0, Math.round(hours * 3600));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Consecutive days (ending today or yesterday) on which a fast was completed
 * that reached at least `minHours`. Mirrors the diary streak rule.
 */
export function computeFastStreak(
  completed: Pick<FastSession, 'startedAt' | 'endedAt' | 'targetHours'>[],
  minHours = 12,
  now = new Date(),
): number {
  const qualifyingDays = new Set<number>();
  for (const s of completed) {
    if (s.endedAt === null) continue;
    if (elapsedHours(s) >= Math.min(minHours, s.targetHours)) {
      // Day index relative to epoch, by the fast's start.
      qualifyingDays.add(differenceInCalendarDays(new Date(s.startedAt), 0));
    }
  }
  if (qualifyingDays.size === 0) return 0;

  const todayIdx = differenceInCalendarDays(now, 0);
  let cursor = todayIdx;
  if (!qualifyingDays.has(cursor)) {
    cursor -= 1;
    if (!qualifyingDays.has(cursor)) return 0;
  }

  let streak = 0;
  while (qualifyingDays.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}
