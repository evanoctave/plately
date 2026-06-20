// =============================================================================
// utils/export — Diary CSV export (write + share sheet)
// =============================================================================
// Glue between `utils/csv.buildCsv` (pure serialization) and the native
// FileSystem + Sharing APIs. Writes the CSV into the app cache, then opens
// the iOS/Android share sheet so the user can email / save / AirDrop.
//
// Wrapped in try/catch by callers — the share sheet can be cancelled, which
// surfaces as a rejected promise from `Sharing.shareAsync`.

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getAllEntries } from '../db/database';
import { buildCsv } from './csv';
import { dayKey } from './date';

export interface ExportResult {
  status: 'shared' | 'empty' | 'unavailable';
  count: number;
}

// Writes the diary to a CSV file and opens the share sheet.
export async function exportDiaryCsv(): Promise<ExportResult> {
  const entries = await getAllEntries();
  if (entries.length === 0) return { status: 'empty', count: 0 };

  const csv = buildCsv(entries);
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) return { status: 'unavailable', count: entries.length };

  const uri = `${dir}plately-export-${dayKey()}.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    return { status: 'unavailable', count: entries.length };
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Plately diary',
    UTI: 'public.comma-separated-values-text',
  });
  return { status: 'shared', count: entries.length };
}
