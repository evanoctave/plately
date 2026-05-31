/**
 * CSV export of the full food diary. Data ownership is a first-class feature:
 * your log is yours, exportable any time, free — no premium tier, no lock-in.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getAllEntries, type FoodEntry } from '../db/database';
import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';
import { dayKey } from './date';

const NUTRITION_KEYS = Object.keys(ZERO_NUTRITION) as (keyof Nutrition)[];

const HEADER = [
  'day',
  'time_iso',
  'name',
  'source',
  'grams',
  ...NUTRITION_KEYS,
];

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

/** Builds the CSV text for all logged entries. */
export function buildCsv(entries: FoodEntry[]): string {
  const lines = [HEADER.join(','), ...entries.map(entryToRow)];
  return lines.join('\n');
}

export interface ExportResult {
  status: 'shared' | 'empty' | 'unavailable';
  count: number;
}

/**
 * Writes the diary to a CSV file and opens the share sheet. Returns a status so
 * the UI can give feedback.
 */
export async function exportDiaryCsv(): Promise<ExportResult> {
  const entries = await getAllEntries();
  if (entries.length === 0) return { status: 'empty', count: 0 };

  const csv = buildCsv(entries);
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) return { status: 'unavailable', count: entries.length };

  const uri = `${dir}nutrisnap-export-${dayKey()}.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    return { status: 'unavailable', count: entries.length };
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export NutriSnap diary',
    UTI: 'public.comma-separated-values-text',
  });
  return { status: 'shared', count: entries.length };
}
