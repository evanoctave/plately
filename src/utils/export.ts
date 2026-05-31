/**
 * CSV export of the full food diary. Data ownership is a first-class feature:
 * your log is yours, exportable any time, free — no premium tier, no lock-in.
 *
 * The pure serialization lives in `csv.ts` (unit-tested); this module only adds
 * the file-writing + share-sheet wrapper that needs native modules.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getAllEntries } from '../db/database';
import { buildCsv } from './csv';
import { dayKey } from './date';

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
