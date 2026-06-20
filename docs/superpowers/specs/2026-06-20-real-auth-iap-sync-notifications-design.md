# Plately — Real Auth, IAP, Cloud Sync, Notifications

Date: 2026-06-20
Status: Approved (design)

## Goal

Turn three currently-stubbed surfaces into real, shippable features, and add the
one missing retention lever:

1. **Auth** — replace the fake `AuthScreen` (fake Apple, "coming soon" Google,
   passwordless email) with real Supabase authentication.
2. **Plately+ IAP** — replace the local `plusActive` toggle with real RevenueCat
   purchases + restore, entitlement-driven.
3. **Cloud sync** — full diary sync across devices, last-write-wins.
4. **Notifications** — local scheduled reminders (meal / streak / water).

## Decisions (locked)

- Backend: **Supabase** (Postgres + Auth + RLS). Free tier.
- IAP: **RevenueCat** (`react-native-purchases`). Entitlement `plus`.
- Platform: **iOS first**. Android keeps compiling, untested.
- Sync scope: **full diary sync** (all SQLite tables + settings).
- Keys: **placeholders via `.env`** now; real keys pasted later.

## Hard constraints / verification boundary

Buildable + testable from the dev environment: code, config plugins, typecheck,
jest, lint, pure-logic unit tests.

NOT verifiable without the user's accounts + a physical device:
- live Supabase auth round-trip,
- real sandbox IAP purchase (no simulator/Expo Go support),
- real push/notification delivery on device.

These get a documented manual **device-test checklist** instead.

## Architecture

### Config (`src/config/env.ts`)
Reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REVENUECAT_IOS_KEY` from
`expo-constants` `extra` (populated from `.env` via `app.config.ts`). Exposes
typed getters + an `isConfigured()` guard so the app degrades gracefully to
local/guest mode when keys are absent (e.g. current placeholder state).

### Auth (`src/auth/`)
- `client.ts` — singleton `supabase` client with AsyncStorage session storage,
  `autoRefreshToken`, `persistSession`.
- `useAuth.ts` — subscribes to `supabase.auth.onAuthStateChange`; mirrors the
  user into `useSettings.account`; triggers `sync.run()` on sign-in; clears the
  sync cursors on sign-out.
- `AuthScreen.tsx` (rewrite) — email/password sign-up + sign-in with validation
  and error states; Sign in with Apple via `expo-apple-authentication` →
  `supabase.auth.signInWithIdToken`. ToS checkbox defaults **unchecked** and is
  **enforced**. Guest path unchanged (local-only, no sync).
- Google deferred (iOS-first); button hidden rather than shown-broken.

### IAP (`src/iap/`)
- `purchases.ts` — `Purchases.configure({ apiKey })` on launch when configured;
  helpers: `getOfferings`, `purchase(pkg)`, `restore()`, `addCustomerInfoListener`.
- Entitlement `plus` → `setPlusActive(active)`. `usePlus.unlock` is no longer
  arbitrary: purchases drive it; a dev-only manual toggle stays behind
  `__DEV__` for testing without StoreKit.
- `PlatelyPlusScreen.tsx` (rewrite) — real Offerings (monthly/yearly packages),
  purchase + **Restore Purchases** (Apple-required), price strings from the
  store, loading/empty/error states.

### Notifications (`src/notifications/`)
- `notifications.ts` — `expo-notifications` permission request + a scheduler:
  - meal reminders (breakfast/lunch/dinner — configurable times),
  - streak-at-risk evening nudge (only if nothing logged today),
  - optional water reminders.
- All **local** scheduled notifications — no APNs/push server needed.
- Permission asked during onboarding (`profile.notificationsEnabled` exists);
  Settings exposes a master toggle + reminder times.

### Sync (`src/sync/`)
- `schema.ts` — a `SyncableTable` registry describing each table: name, primary
  key, syncable columns. Tables: `entries`, `weights`, `custom_foods`,
  `favorites`, `fasting_sessions`, `meal_plans`, `phases`, plus `user_settings`
  (settings store snapshot).
- `migrate.ts` — additive local migration: add `updated_at INTEGER`,
  `deleted INTEGER DEFAULT 0`, `dirty INTEGER DEFAULT 1` to each table. Existing
  rows backfilled (`updated_at = createdAt` where present, else now).
- `merge.ts` (pure, unit-tested) — last-write-wins resolution: apply a remote
  row only when `remote.updated_at > local.updated_at`. Tombstones (`deleted=1`)
  propagate.
- `engine.ts` — per-table `push` (dirty rows → Supabase upsert, clear `dirty` on
  success) and `pull` (remote rows since per-table cursor → LWW merge, written
  with `dirty=0`). Cursors in AsyncStorage. `run()` does pull-then-push for all
  tables. Triggers: sign-in, app foreground (AppState), debounced after
  mutations. Guest / unconfigured → no-op.
- Existing db write paths set `updated_at = now`, `dirty = 1`; deletes become
  soft (`deleted=1, dirty=1`) so they sync, with a periodic hard-purge of synced
  tombstones.

### Supabase SQL (`supabase/migrations/0001_init.sql`)
One table per syncable table, columns mirroring local + `user_id uuid`,
`updated_at bigint`, `deleted boolean`. Primary key `(user_id, id)` (or
`(user_id, day)` / `(user_id, foodId)` per table). **RLS** on every table:
`auth.uid() = user_id` for select/insert/update/delete. Committed as SQL the
user runs in the Supabase SQL editor or via the Supabase CLI.

## Data flow

```
local write ──> SQLite (dirty=1, updated_at=now) ──> debounced sync.run()
sign-in / foreground ──> sync.run() ──> pull (LWW merge) then push (upsert)
RevenueCat purchase ──> CustomerInfo listener ──> setPlusActive(true)
auth state change ──> useSettings.account + sync cursors
```

## Error handling
- Network errors in sync: swallowed + retried next trigger (local-first, never
  blocks UI).
- Auth errors: surfaced inline on AuthScreen.
- IAP errors: user-cancelled purchases are silent; real failures show an alert.
- Missing config (placeholders): every integration guards on `isConfigured()`
  and the app stays fully usable in local/guest mode.

## Testing
- Unit (jest, no network): `merge` LWW resolution + tombstones; auth email/
  password validation; entitlement → `plusActive` mapping; notification
  schedule computation.
- typecheck + lint green.
- Manual device checklist in `docs/DEVICE_TEST_CHECKLIST.md` for the store/push
  paths only a device can verify.

## Docs reconciliation
README + `docs/APP_STORE_SUBMISSION.md` updated: optional account (collects
email → App Privacy "Data Linked to You: Email"), optional Plately+ subscription
(IAP), local notifications. Removes the "no account / no subscription / data not
collected" claims that the new features contradict.

## Out of scope (YAGNI now)
- Google sign-in (deferred until Android pass).
- Remote push (APNs) — local notifications cover retention.
- Conflict-resolution UI — LWW is sufficient for single-user/multi-device.
- Real-time subscriptions — poll-on-trigger sync is enough.
