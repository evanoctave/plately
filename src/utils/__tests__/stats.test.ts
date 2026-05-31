import { average, computeStreak, lastNDays } from '../stats';

describe('lastNDays', () => {
  it('returns n day-keys ending today, oldest first', () => {
    const today = new Date('2026-05-31T12:00:00');
    const days = lastNDays(3, today);
    expect(days).toEqual(['2026-05-29', '2026-05-30', '2026-05-31']);
  });

  it('handles n=1', () => {
    const today = new Date('2026-01-01T00:00:00');
    expect(lastNDays(1, today)).toEqual(['2026-01-01']);
  });
});

describe('average', () => {
  it('averages a list', () => {
    expect(average([2, 4, 6])).toBe(4);
  });
  it('returns 0 for empty', () => {
    expect(average([])).toBe(0);
  });
});

describe('computeStreak', () => {
  const today = new Date('2026-05-31T12:00:00');

  it('counts consecutive days ending today', () => {
    const days = ['2026-05-29', '2026-05-30', '2026-05-31'];
    expect(computeStreak(days, today)).toBe(3);
  });

  it('still counts when today is not yet logged but yesterday is', () => {
    const days = ['2026-05-29', '2026-05-30'];
    expect(computeStreak(days, today)).toBe(2);
  });

  it('breaks on a gap', () => {
    const days = ['2026-05-27', '2026-05-28', '2026-05-31'];
    expect(computeStreak(days, today)).toBe(1);
  });

  it('returns 0 when nothing recent', () => {
    const days = ['2026-05-01'];
    expect(computeStreak(days, today)).toBe(0);
  });

  it('returns 0 for empty', () => {
    expect(computeStreak([], today)).toBe(0);
  });
});
