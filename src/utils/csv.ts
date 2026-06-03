// Pure CSV serialization for the diary (no native imports; unit-testable).

import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';
import type { FoodEntry } from '../db/database';

const NUTRITION_KEYS = Object.keys(ZERO_NUTRITION) as (keyof Nutrition)[];

export const CSV_HEADER = ['day', 'time_iso', 'name', 'source', 'grams', ...NUTRITION_KEYS];

function escapeCsv(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function entryToRow(e: FoodEntry): string {
  const cells: (string | number)[] = [
    e.day,
    new Date(e.createdAt).toISOString(),
    e.name,
    e.source,
    e.grams,
    ...NUTRITION_KEYS.map((k) => e[k]),
  ];
  return cells.map(escapeCsv).join(',');
}

/** Builds the CSV text for the given entries (header + one row each). */
export function buildCsv(entries: FoodEntry[]): string {
  return [CSV_HEADER.join(','), ...entries.map(entryToRow)].join('\n');
}
