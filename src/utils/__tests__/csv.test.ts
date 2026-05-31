import { buildCsv } from '../csv';
import type { FoodEntry } from '../../db/database';
import { ZERO_NUTRITION } from '../../data/nutrients';

function makeEntry(over: Partial<FoodEntry>): FoodEntry {
  return {
    id: 'x',
    day: '2026-05-31',
    createdAt: 1748649600000,
    foodId: 'apple',
    name: 'Apple',
    grams: 100,
    photoUri: null,
    source: 'search',
    ...ZERO_NUTRITION,
    calories: 52,
    ...over,
  };
}

describe('buildCsv', () => {
  it('emits a header plus one row per entry', () => {
    const csv = buildCsv([makeEntry({}), makeEntry({ id: 'y' })]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('day');
    expect(lines[0]).toContain('calories');
    expect(lines[1]).toContain('Apple');
    expect(lines[1]).toContain('52');
  });

  it('escapes commas and quotes in names', () => {
    const csv = buildCsv([makeEntry({ name: 'Rice, fried "special"' })]);
    expect(csv).toContain('"Rice, fried ""special"""');
  });

  it('handles an empty list (header only)', () => {
    const csv = buildCsv([]);
    expect(csv.split('\n')).toHaveLength(1);
  });
});
