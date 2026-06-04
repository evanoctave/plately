import {
  computeAchievements,
  longestStreak,
  freezeTokens,
  type AchievementStats,
} from '../achievements';

const baseStats: AchievementStats = {
  totalEntries: 0,
  loggedDaysCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  customFoodsCount: 0,
  waterGoalDays: 0,
};

describe('computeAchievements', () => {
  it('locks everything for a fresh user', () => {
    const progress = computeAchievements(baseStats);
    expect(progress.every((p) => !p.unlocked)).toBe(true);
    expect(progress.every((p) => p.pct === 0)).toBe(true);
  });

  it('unlocks at and above the goal, clamps pct to 1', () => {
    const progress = computeAchievements({ ...baseStats, totalEntries: 50 });
    const fifty = progress.find((p) => p.id === 'fifty-logs')!;
    expect(fifty.unlocked).toBe(true);
    expect(fifty.pct).toBe(1);

    const firstBite = progress.find((p) => p.id === 'first-bite')!;
    expect(firstBite.unlocked).toBe(true);

    const pro = progress.find((p) => p.id === 'five-hundred-logs')!;
    expect(pro.unlocked).toBe(false);
    expect(pro.pct).toBeCloseTo(0.1);
  });

  it('reads the right metric per achievement', () => {
    const progress = computeAchievements({ ...baseStats, longestStreak: 7, waterGoalDays: 7 });
    expect(progress.find((p) => p.id === 'streak-7')!.unlocked).toBe(true);
    expect(progress.find((p) => p.id === 'streak-30')!.unlocked).toBe(false);
    expect(progress.find((p) => p.id === 'hydrate-7')!.unlocked).toBe(true);
  });
});

describe('longestStreak', () => {
  it('returns 0 for no days', () => {
    expect(longestStreak([])).toBe(0);
  });

  it('counts a single day as 1', () => {
    expect(longestStreak(['2026-01-01'])).toBe(1);
  });

  it('finds the longest consecutive run, ignoring gaps and order', () => {
    const days = ['2026-01-05', '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-09'];
    expect(longestStreak(days)).toBe(3);
  });

  it('de-dupes repeated days', () => {
    expect(longestStreak(['2026-01-01', '2026-01-01', '2026-01-02'])).toBe(2);
  });

  it('handles month boundaries', () => {
    expect(longestStreak(['2026-01-30', '2026-01-31', '2026-02-01'])).toBe(3);
  });
});

describe('freezeTokens', () => {
  it('grants one per full week of best streak', () => {
    expect(freezeTokens(0)).toBe(0);
    expect(freezeTokens(6)).toBe(0);
    expect(freezeTokens(7)).toBe(1);
    expect(freezeTokens(20)).toBe(2);
  });
});
