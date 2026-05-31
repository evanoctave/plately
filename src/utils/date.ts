import { format, isToday, isYesterday } from 'date-fns';

/** Local calendar day key, e.g. "2026-05-31". Used to group diary entries. */
export function dayKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function prettyDay(key: string): string {
  const date = new Date(`${key}T00:00:00`);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMM d');
}

export function prettyTime(timestampMs: number): string {
  return format(new Date(timestampMs), 'h:mm a');
}
