// =============================================================================
// sync/merge — Pure Last-Write-Wins conflict resolution
// =============================================================================
// No SQLite, no network — just the decisions. Kept pure so the conflict rules
// are unit-tested in isolation. The engine feeds it timestamps and acts on the
// verdicts.
//
// The rule is Last-Write-Wins keyed on `updated_at` (epoch ms). On an exact
// tie the remote wins: remote is the shared source of truth, so converging
// toward it keeps every device deterministic.

/** A row as it arrives from the server. `deleted` marks a tombstone. */
export interface RemoteRow {
  updated_at: number;
  deleted: boolean;
}

/**
 * Should the incoming remote row overwrite what we have locally?
 * `localUpdatedAt` is null when the row doesn't exist locally yet.
 */
export function shouldApplyRemote(localUpdatedAt: number | null, remoteUpdatedAt: number): boolean {
  if (localUpdatedAt === null) return true;
  return remoteUpdatedAt >= localUpdatedAt;
}

/**
 * Advance a per-table pull cursor. The next pull asks for everything strictly
 * newer than this, so the cursor must be the largest `updated_at` we've seen.
 */
export function nextCursor(current: number, rows: RemoteRow[]): number {
  return rows.reduce((max, r) => (r.updated_at > max ? r.updated_at : max), current);
}
