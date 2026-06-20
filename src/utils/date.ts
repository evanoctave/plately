// =============================================================================
// utils/date — Date / day-key helpers
// =============================================================================
// All diary entries are grouped by a local-calendar day key (`yyyy-MM-dd`).
// These helpers convert between Date objects and that key, and produce the
// human-friendly variants ("Today", "Yesterday", "Tue, May 31").
//
// Everything runs in the device's local timezone. Don't introduce UTC keys
// without migrating — historical entries depend on the device-local date.

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
