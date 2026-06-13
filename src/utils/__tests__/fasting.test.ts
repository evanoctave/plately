import {
  HOUR_MS,
  computeFastStreak,
  elapsedHours,
  fastProgress,
  formatCountdown,
  formatHoursLabel,
} from '../fasting';

describe('elapsedHours / fastProgress', () => {
  const start = 1_000_000_000_000;

  it('measures elapsed hours against now for an open fast', () => {
    const now = start + 8 * HOUR_MS;
    expect(elapsedHours({ startedAt: start, endedAt: null }, now)).toBeCloseTo(8);
  });

  it('uses endedAt for a finished fast', () => {
    expect(elapsedHours({ startedAt: start, endedAt: start + 16 * HOUR_MS })).toBeCloseTo(16);
  });

  it('clamps progress to 1', () => {
    const now = start + 20 * HOUR_MS;
    expect(fastProgress({ startedAt: start, endedAt: null, targetHours: 16 }, now)).toBe(1);
  });
});

describe('format helpers', () => {
  it('formats hours and minutes', () => {
    expect(formatHoursLabel(16.5)).toBe('16h 30m');
    expect(formatHoursLabel(0.25)).toBe('15m');
  });

  it('formats a countdown', () => {
    expect(formatCountdown(2.5)).toBe('02:30:00');
  });
});

describe('computeFastStreak', () => {
  const day = (iso: string, hours: number) => ({
    startedAt: new Date(`${iso}T08:00:00`).getTime(),
    endedAt: new Date(`${iso}T08:00:00`).getTime() + hours * HOUR_MS,
    targetHours: 16,
  });

  it('counts consecutive qualifying days', () => {
    const now = new Date('2026-05-31T20:00:00');
    const sessions = [day('2026-05-31', 16), day('2026-05-30', 17), day('2026-05-29', 16)];
    expect(computeFastStreak(sessions, 12, now)).toBe(3);
  });

  it('ignores fasts that did not reach the minimum', () => {
    const now = new Date('2026-05-31T20:00:00');
    const sessions = [day('2026-05-31', 6)];
    expect(computeFastStreak(sessions, 12, now)).toBe(0);
  });
});
