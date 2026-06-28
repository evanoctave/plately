// =============================================================================
// delete-account — permanently delete the caller's account + all their data
// =============================================================================
// Satisfies App Store Guideline 5.1.1(v): an account created in-app must be
// deletable in-app. The client invokes this with the signed-in user's JWT;
// we verify it, then delete the auth user with the service-role key. Every
// synced table references auth.users(id) ON DELETE CASCADE (see
// migrations/0001_init.sql), so removing the user wipes all of their rows.
//
// Deploy:
//   supabase functions deploy delete-account
// The SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars are injected by the
// platform; no secrets are committed.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Native app never sets Origin; a browser always does on cross-origin calls.
  // Reject any browser-originated request rather than echoing a wildcard origin.
  if (req.headers.get('Origin')) return json({ error: 'Forbidden' }, 403);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return json({ error: 'Missing authorization token' }, 401);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Server is not configured' }, 500);

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Resolve the caller from their JWT — never trust a user id from the body.
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData.user) {
    return json({ error: 'Invalid or expired session' }, 401);
  }

  // Cascade deletes every row this user owns across all synced tables.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    return json({ error: deleteError.message }, 500);
  }

  return json({ ok: true }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
