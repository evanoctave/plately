import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!dbPromise) {
        dbPromise = (async () => {
            const db = await SQLite.openDatabaseAsync('plately.db');
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS weights (
                day TEXT PRIMARY KEY NOT NULL,
                kg REAL NOT NULL,
                createdAt INTEGER NOT NULL
            );
            `);
            return db;
        })();
    }
    return dbPromise;
}

export interface WeightRow {
    day: string;
    kg: number;
}

export async function addWeight(day: string, kg: number):
Promise<void> {
    const db =await getDb();
    await db.runAsync(
        `INSERT OR REPLACE INTO weights (day, kg, createdAt) VALUES (?, ?, ?)`,
        [day, kg, Date.now()],
    );
}

export async function getWeights(fromDay: string):
Promise<WeightRow[]> {
    const db = await getDb();
    return db.getAllAsync<WeightRow>(
        'SELECT day, kg FROM weights WHERE day >= ? ORDER BY day ASC',
        [fromDay],
    );
}

export async function deleteWeight(day: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM weights WHERE day = ?', [day]);
}

export async function latestWeight(): Promise<WeightRow | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<WeightRow>(
        'SELECT day, kg FROM weights ORDER BY day DESC LIMIT 1',
    );
    return row ?? null;
}