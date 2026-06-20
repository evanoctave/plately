// =============================================================================
// sync/remote — The Supabase side of sync
// =============================================================================
// Pushes local changes up and pulls remote changes down for one table. Every
// remote table mirrors its local counterpart plus three columns the server
// owns: `user_id` (RLS scope), `updated_at` (epoch ms, the LWW key), and
// `deleted` (tombstone flag). Conflicts resolve on (user_id, pk).

import { requireSupabase } from '../auth/client';
import type { SyncTable } from './registry';
import type { DirtyRow } from './local';
import type { RemoteRow } from './merge';

/** Upsert changed rows for the signed-in user. No-op for an empty batch. */
export async function pushRows(uid: string, t: SyncTable, rows: DirtyRow[]): Promise<void> {
  if (rows.length === 0) return;
  const payload = rows.map((r) => ({
    ...r.values,
    user_id: uid,
    updated_at: r.updated_at,
    deleted: false,
  }));
  const { error } = await requireSupabase()
    .from(t.name)
    .upsert(payload, { onConflict: `user_id,${t.pk}` });
  if (error) throw error;
}

/** Upsert tombstones (deleted = true) so deletions propagate to other devices. */
export async function pushTombstones(
  uid: string,
  t: SyncTable,
  tombs: { pk: string; deleted_at: number }[],
): Promise<void> {
  if (tombs.length === 0) return;
  const payload = tombs.map((tomb) => ({
    [t.pk]: tomb.pk,
    user_id: uid,
    updated_at: tomb.deleted_at,
    deleted: true,
  }));
  const { error } = await requireSupabase()
    .from(t.name)
    .upsert(payload, { onConflict: `user_id,${t.pk}` });
  if (error) throw error;
}

/** Everything for this user changed strictly after `cursor`, oldest first. */
export async function pullSince(
  uid: string,
  t: SyncTable,
  cursor: number,
): Promise<(Record<string, unknown> & RemoteRow)[]> {
  const { data, error } = await requireSupabase()
    .from(t.name)
    .select('*')
    .eq('user_id', uid)
    .gt('updated_at', cursor)
    .order('updated_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { user_id, ...rest } = row as Record<string, unknown>;
    return rest as Record<string, unknown> & RemoteRow;
  });
}
