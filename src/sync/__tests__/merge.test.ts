import { shouldApplyRemote, nextCursor } from '../merge';

describe('shouldApplyRemote (Last-Write-Wins)', () => {
  it('applies when the row is absent locally', () => {
    expect(shouldApplyRemote(null, 100)).toBe(true);
  });

  it('applies when the remote edit is newer', () => {
    expect(shouldApplyRemote(100, 200)).toBe(true);
  });

  it('keeps local when the local edit is newer', () => {
    expect(shouldApplyRemote(200, 100)).toBe(false);
  });

  it('lets remote win on an exact tie (deterministic convergence)', () => {
    expect(shouldApplyRemote(150, 150)).toBe(true);
  });
});

describe('nextCursor', () => {
  it('returns the current cursor when there are no rows', () => {
    expect(nextCursor(50, [])).toBe(50);
  });

  it('advances to the largest updated_at seen', () => {
    const rows = [
      { updated_at: 80, deleted: false },
      { updated_at: 120, deleted: true },
      { updated_at: 95, deleted: false },
    ];
    expect(nextCursor(50, rows)).toBe(120);
  });

  it('never moves backwards below the current cursor', () => {
    const rows = [{ updated_at: 10, deleted: false }];
    expect(nextCursor(50, rows)).toBe(50);
  });
});
