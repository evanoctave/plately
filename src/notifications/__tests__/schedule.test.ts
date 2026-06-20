import { buildSchedule, DEFAULT_REMINDERS } from '../schedule';

describe('buildSchedule', () => {
  it('schedules nothing when reminders are disabled', () => {
    expect(buildSchedule({ ...DEFAULT_REMINDERS, enabled: false })).toEqual([]);
  });

  it('includes the three meal nudges when meals are on', () => {
    const out = buildSchedule({ enabled: true, meals: true, water: false, streak: false });
    expect(out.map((r) => r.key)).toEqual(['meal-breakfast', 'meal-lunch', 'meal-dinner']);
  });

  it('adds the water and streak nudges when enabled', () => {
    const out = buildSchedule({ enabled: true, meals: false, water: true, streak: true });
    expect(out.map((r) => r.key)).toEqual(['water-afternoon', 'streak-evening']);
  });

  it('produces every reminder with a valid 24h time', () => {
    const out = buildSchedule({ enabled: true, meals: true, water: true, streak: true });
    expect(out).toHaveLength(5);
    for (const r of out) {
      expect(r.hour).toBeGreaterThanOrEqual(0);
      expect(r.hour).toBeLessThan(24);
      expect(r.minute).toBeGreaterThanOrEqual(0);
      expect(r.minute).toBeLessThan(60);
    }
  });

  it('keeps reminder keys unique so they de-dupe on re-schedule', () => {
    const out = buildSchedule({ enabled: true, meals: true, water: true, streak: true });
    expect(new Set(out.map((r) => r.key)).size).toBe(out.length);
  });
});
