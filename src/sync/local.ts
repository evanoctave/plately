// =============================================================================
// sync/local — The SQLite side of sync
// =============================================================================
// Owns everything that touches the local database for sync purposes:
//   - adds the `updated_at` / `dirty` bookkeeping columns (additively),
//   - installs triggers that auto-stamp those columns on every user write,
//   - records hard deletes as tombstones so they can propagate,
//   - reads the pending (dirty) rows + tombstones to push,
//   - applies pulled remote rows under an "applying" guard so the triggers
//     don't treat an incoming change as a fresh local edit (echo prevention).
//
// Why triggers instead of editing every db/* write path: it keeps sync
// completely out of the feature modules. They INSERT/UPDATE/DELETE exactly as
// before; the database stamps the bookkeeping for them.

import * as SQLite from 'expo-sqlite';

import { SYNC_TABLES, dataColumns, type SyncTable } from './registry';
import { shouldApplyRemote, type RemoteRow } from './merge';

/** Epoch-ms expression usable inside SQLite triggers/statements. */
const NOW_MS = `CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Open (once) the sync connection to the shared db and guarantee every synced
 * table has its bookkeeping columns + triggers. Safe to call repeatedly.
 */
export async function initLocal(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      // Make sure every feature module has run its CREATE TABLE first.
      await Promise.all(SYNC_TABLES.map((t) => t.ensureReady()));

      const db = await SQLite.openDatabaseAsync('plately.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS _sync_ctl (
          id INTEGER PRIMARY KEY CHECK (id = 0),
          applying INTEGER NOT NULL DEFAULT 0
        );
        INSERT OR IGNORE INTO _sync_ctl (id, applying) VALUES (0, 0);
        CREATE TABLE IF NOT EXISTS _sync_tombstones (
          table_name TEXT NOT NULL,
          pk TEXT NOT NULL,
          deleted_at INTEGER NOT NULL,
          PRIMARY KEY (table_name, pk)
        );
      `);

      for (const t of SYNC_TABLES) await ensureTableSync(db, t);
      return db;
    })();
  }
  return dbPromise;
}

/** Names of columns already on a table. */
async function existingColumns(db: SQLite.SQLiteDatabase, table: string): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info("${table}")`);
  return new Set(rows.map((r) => r.name));
}

/** Add bookkeeping columns + triggers to one table. Idempotent. */
async function ensureTableSync(db: SQLite.SQLiteDatabase, t: SyncTable): Promise<void> {
  const cols = await existingColumns(db, t.name);
  const freshlyTracked = !cols.has('dirty');

  if (!cols.has('updated_at')) {
    await db.execAsync(`ALTER TABLE "${t.name}" ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0`);
  }
  if (!cols.has('dirty')) {
    await db.execAsync(`ALTER TABLE "${t.name}" ADD COLUMN dirty INTEGER NOT NULL DEFAULT 0`);
  }

  // First time we attach sync to a table that may already hold (guest) data:
  // mark every existing row dirty so it uploads on the first sync. Triggers
  // aren't installed yet, so this bulk update won't recurse.
  if (freshlyTracked) {
    await db.execAsync(`UPDATE "${t.name}" SET dirty = 1, updated_at = ${NOW_MS} WHERE updated_at = 0`);
  }

  // INSERT: stamp the new row. The stamping UPDATE changes updated_at, so the
  // AFTER UPDATE trigger's guard (NEW.updated_at = OLD.updated_at) fails and it
  // does not re-fire.
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS _sync_${t.name}_ai AFTER INSERT ON "${t.name}"
    WHEN (SELECT applying FROM _sync_ctl WHERE id = 0) = 0
    BEGIN
      UPDATE "${t.name}" SET updated_at = ${NOW_MS}, dirty = 1 WHERE "${t.pk}" = NEW."${t.pk}";
    END;
  `);

  // UPDATE: only a genuine user edit leaves updated_at untouched. Our own
  // bookkeeping writes bump updated_at, so the guard skips them (no recursion).
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS _sync_${t.name}_au AFTER UPDATE ON "${t.name}"
    WHEN (SELECT applying FROM _sync_ctl WHERE id = 0) = 0
      AND NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE "${t.name}" SET updated_at = ${NOW_MS}, dirty = 1 WHERE "${t.pk}" = NEW."${t.pk}";
    END;
  `);

  // DELETE: record a tombstone so the deletion propagates to other devices.
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS _sync_${t.name}_ad AFTER DELETE ON "${t.name}"
    WHEN (SELECT applying FROM _sync_ctl WHERE id = 0) = 0
    BEGIN
      INSERT OR REPLACE INTO _sync_tombstones (table_name, pk, deleted_at)
      VALUES ('${t.name}', OLD."${t.pk}", ${NOW_MS});
    END;
  `);
}

/** Run `fn` with the echo-prevention flag set, so sync writes don't re-dirty. */
async function withApplying<T>(db: SQLite.SQLiteDatabase, fn: () => Promise<T>): Promise<T> {
  await db.runAsync(`UPDATE _sync_ctl SET applying = 1 WHERE id = 0`);
  try {
    return await fn();
  } finally {
    await db.runAsync(`UPDATE _sync_ctl SET applying = 0 WHERE id = 0`);
  }
}

/** One row pending upload: its data plus the timestamp it was stamped with. */
export interface DirtyRow {
  values: Record<string, unknown>;
  updated_at: number;
}

/** Rows the user has changed since the last successful push. */
export async function readDirty(db: SQLite.SQLiteDatabase, t: SyncTable): Promise<DirtyRow[]> {
  const select = [...dataColumns(t), 'updated_at'].join(', ');
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT ${select} FROM "${t.name}" WHERE dirty = 1`,
  );
  return rows.map((r) => {
    const { updated_at, ...values } = r;
    return { values, updated_at: Number(updated_at) };
  });
}

/** Local deletions waiting to propagate. */
export async function readTombstones(
  db: SQLite.SQLiteDatabase,
  t: SyncTable,
): Promise<{ pk: string; deleted_at: number }[]> {
  return db.getAllAsync<{ pk: string; deleted_at: number }>(
    `SELECT pk, deleted_at FROM _sync_tombstones WHERE table_name = ? ORDER BY deleted_at`,
    [t.name],
  );
}

/** Clear the dirty flag for a pushed row — but only if it hasn't changed since. */
export async function clearDirty(
  db: SQLite.SQLiteDatabase,
  t: SyncTable,
  pk: unknown,
  updatedAt: number,
): Promise<void> {
  await withApplying(db, async () => {
    await db.runAsync(
      `UPDATE "${t.name}" SET dirty = 0 WHERE "${t.pk}" = ? AND updated_at = ?`,
      [pk as SQLite.SQLiteBindValue, updatedAt],
    );
  });
}

/** Drop a tombstone once its deletion has been pushed. */
export async function clearTombstone(
  db: SQLite.SQLiteDatabase,
  t: SyncTable,
  pk: string,
): Promise<void> {
  await db.runAsync(`DELETE FROM _sync_tombstones WHERE table_name = ? AND pk = ?`, [t.name, pk]);
}

/**
 * Apply pulled remote rows to the local table under Last-Write-Wins. Each row
 * carries the table's columns plus `updated_at` and `deleted`. Runs with the
 * applying guard so the writes don't bounce back as fresh local edits.
 */
export async function applyRemote(
  db: SQLite.SQLiteDatabase,
  t: SyncTable,
  rows: (Record<string, unknown> & RemoteRow)[],
): Promise<void> {
  if (rows.length === 0) return;
  const cols = dataColumns(t);
  const placeholders = [...cols, 'updated_at', 'dirty'].map(() => '?').join(', ');
  const insertSql =
    `INSERT OR REPLACE INTO "${t.name}" (${[...cols, 'updated_at', 'dirty'].join(', ')}) ` +
    `VALUES (${placeholders})`;

  await withApplying(db, async () => {
    for (const row of rows) {
      const pkVal = row[t.pk];
      const local = await db.getFirstAsync<{ updated_at: number }>(
        `SELECT updated_at FROM "${t.name}" WHERE "${t.pk}" = ?`,
        [pkVal as SQLite.SQLiteBindValue],
      );
      if (!shouldApplyRemote(local ? local.updated_at : null, row.updated_at)) continue;

      if (row.deleted) {
        await db.runAsync(`DELETE FROM "${t.name}" WHERE "${t.pk}" = ?`, [pkVal as SQLite.SQLiteBindValue]);
      } else {
        const values = cols.map((c) => row[c] as SQLite.SQLiteBindValue);
        await db.runAsync(insertSql, [...values, row.updated_at, 0]);
      }
    }
  });
}
