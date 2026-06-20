// =============================================================================
// db/fasting — Intermittent fasting sessions (SQLite)
// =============================================================================
// One row per fasting window. `endedAt` is null while a fast is in progress,
// so "the active fast" is the row with `endedAt IS NULL` (there should never
// be more than one — `state/useFasting` enforces that by gating Start in the UI).
//
// Powers the Fasting screen (Plus-only feature) and its streak.

import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('plately.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS fasting_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          startedAt INTEGER NOT NULL,
          endedAt INTEGER,
          targetHours REAL NOT NULL,
          day TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_fasting_day ON fasting_sessions (day);
      `);
      return db;
    })();
  }
  return dbPromise;
}

export interface FastSession {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number | null; // null while in progress
  targetHours: number;
  day: string; // "yyyy-MM-dd" of start
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Returns the in-progress fast, or null. Only one can be active at a time. */
export async function getActiveFast(): Promise<FastSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<FastSession>(
    'SELECT * FROM fasting_sessions WHERE endedAt IS NULL ORDER BY startedAt DESC LIMIT 1',
  );
  return row ?? null;
}

/** Starts a fast. Closes any stale active fast first so state stays consistent. */
export async function startFast(targetHours: number, day: string): Promise<FastSession> {
  const db = await getDb();
  await db.runAsync('UPDATE fasting_sessions SET endedAt = startedAt WHERE endedAt IS NULL');
  const session: FastSession = {
    id: makeId(),
    startedAt: Date.now(),
    endedAt: null,
    targetHours,
    day,
  };
  await db.runAsync(
    'INSERT INTO fasting_sessions (id, startedAt, endedAt, targetHours, day) VALUES (?, ?, ?, ?, ?)',
    [session.id, session.startedAt, null, session.targetHours, session.day],
  );
  return session;
}

export async function endFast(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE fasting_sessions SET endedAt = ? WHERE id = ?', [Date.now(), id]);
}

export async function deleteFast(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM fasting_sessions WHERE id = ?', [id]);
}

/** Completed fasts, newest first. */
export async function getRecentFasts(limit = 30): Promise<FastSession[]> {
  const db = await getDb();
  return db.getAllAsync<FastSession>(
    'SELECT * FROM fasting_sessions WHERE endedAt IS NOT NULL ORDER BY startedAt DESC LIMIT ?',
    [limit],
  );
}
