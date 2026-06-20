// =============================================================================
// sync/engine — Orchestrates a full push/pull cycle
// =============================================================================
// The public face of sync. `runSync()` walks every registered table: it pushes
// the user's local changes (and deletions) up, pulls remote changes down, and
// applies them under Last-Write-Wins. Per-table cursors live in AsyncStorage so
// each pull only fetches what changed since last time.
//
// Triggered from: sign-in (auth listener), app foreground (bootstrap), and the
// "Sync now" affordance. Re-entrancy is guarded — a second call while one is in
// flight is a no-op, not a queue.
//
// Everything is fail-soft: a network blip throws out of the current run and the
// next trigger retries. Nothing here ever blocks the UI.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../auth/client';
import { SYNC_TABLES, type SyncTable } from './registry';
import { nextCursor } from './merge';
import {
  initLocal,
  readDirty,
  readTombstones,
  clearDirty,
  clearTombstone,
  applyRemote,
} from './local';
import { pushRows, pushTombstones, pullSince } from './remote';

let running = false;

const cursorKey = (uid: string, table: string): string => `sync:cursor:${uid}:${table}`;

async function getCursor(uid: string, table: string): Promise<number> {
  const raw = await AsyncStorage.getItem(cursorKey(uid, table));
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

async function setCursor(uid: string, table: string, value: number): Promise<void> {
  await AsyncStorage.setItem(cursorKey(uid, table), String(value));
}

/**
 * Run one full sync cycle for the signed-in user. No-op when Supabase isn't
 * configured, nobody is signed in, or a sync is already running.
 */
export async function runSync(): Promise<void> {
  if (!supabase || running) return;
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return;

  running = true;
  try {
    const db = await initLocal();
    for (const t of SYNC_TABLES) {
      await syncTable(db, uid, t);
    }
  } finally {
    running = false;
  }
}

async function syncTable(
  db: Awaited<ReturnType<typeof initLocal>>,
  uid: string,
  t: SyncTable,
): Promise<void> {
  // 1. Push local edits, then clear their dirty flags (only if unchanged since).
  const dirty = await readDirty(db, t);
  await pushRows(uid, t, dirty);
  for (const row of dirty) {
    await clearDirty(db, t, row.values[t.pk], row.updated_at);
  }

  // 2. Push deletions, then drop the tombstones.
  const tombs = await readTombstones(db, t);
  await pushTombstones(uid, t, tombs);
  for (const tomb of tombs) {
    await clearTombstone(db, t, tomb.pk);
  }

  // 3. Pull everything newer than our cursor and merge it in (LWW).
  const cursor = await getCursor(uid, t.name);
  const rows = await pullSince(uid, t, cursor);
  await applyRemote(db, t, rows);

  const advanced = nextCursor(cursor, rows);
  if (advanced !== cursor) await setCursor(uid, t.name, advanced);
}

/**
 * Forget every pull cursor (called on sign-out). The next account starts from
 * zero and does a full pull, so one user's cursors never carry into another's.
 */
export async function resetSyncState(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const mine = keys.filter((k) => k.startsWith('sync:cursor:'));
  if (mine.length > 0) await AsyncStorage.multiRemove(mine);
}
