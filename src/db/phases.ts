// =============================================================================
// db/phases — Goal phases (SQLite)
// =============================================================================
// Saved nutrition goal presets — typically a cycle of "cut → maintain → bulk"
// for users following a structured programming. Each phase carries its own
// `Goals` payload (calories + macros) that, when "active", overrides the
// settings store goals.
//
// Powers the GoalPhases screen (Plus-only).

import * as SQLite from 'expo-sqlite';

import type { Goals } from '../data/nutrients';

export type PhaseKind = 'cut' | 'maintain' | 'bulk';

export interface GoalPhase extends Goals {
  id: string;
  name: string;
  kind: PhaseKind;
  active: number; // 0/1 — SQLite has no bool
  createdAt: number;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('plately.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS goal_phases (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          kind TEXT NOT NULL,
          calories REAL NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fat REAL NOT NULL,
          water REAL NOT NULL,
          active INTEGER NOT NULL DEFAULT 0,
          createdAt INTEGER NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

/** Ensure the table exists. Called by the sync engine before it attaches triggers. */
export async function ensureReady(): Promise<void> {
  await getDb();
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listPhases(): Promise<GoalPhase[]> {
  const db = await getDb();
  return db.getAllAsync<GoalPhase>('SELECT * FROM goal_phases ORDER BY createdAt DESC');
}

export async function getActivePhase(): Promise<GoalPhase | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<GoalPhase>('SELECT * FROM goal_phases WHERE active = 1 LIMIT 1');
  return row ?? null;
}

export interface NewPhaseInput {
  name: string;
  kind: PhaseKind;
  goals: Goals;
}

export async function addPhase(input: NewPhaseInput): Promise<GoalPhase> {
  const db = await getDb();
  const phase: GoalPhase = {
    id: makeId(),
    name: input.name,
    kind: input.kind,
    ...input.goals,
    active: 0,
    createdAt: Date.now(),
  };
  await db.runAsync(
    `INSERT INTO goal_phases (id, name, kind, calories, protein, carbs, fat, water, active, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [phase.id, phase.name, phase.kind, phase.calories, phase.protein, phase.carbs, phase.fat, phase.water, phase.createdAt],
  );
  return phase;
}

/** Marks one phase active (clearing others). Pass null to clear all. */
export async function setActivePhase(id: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE goal_phases SET active = 0');
  if (id) await db.runAsync('UPDATE goal_phases SET active = 1 WHERE id = ?', [id]);
}

export async function deletePhase(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM goal_phases WHERE id = ?', [id]);
}
