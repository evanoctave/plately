# Device test checklist — auth, IAP, sync & notifications

These flows touch native modules and live backends, so they **cannot** be
verified from the repo with typecheck / unit tests / lint alone. They need a
physical iOS device (or sandbox), your Supabase + RevenueCat keys, and a
development or TestFlight build. Run this list once before shipping, and again
after any change to `src/auth`, `src/iap`, `src/sync`, or `src/notifications`.

What **is** already verified automatically: TypeScript types, the pure unit
tests (LWW merge, auth validation, reminder schedule), and lint. What's below is
everything those can't reach.

## 0. Setup

- [ ] `.env` filled with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REVENUECAT_IOS_KEY`.
- [ ] Supabase schema applied (`supabase/migrations/0001_init.sql`).
- [ ] Sign in with Apple capability enabled on the App ID.
- [ ] RevenueCat `plus` entitlement + sandbox subscription products configured.
- [ ] Build installed on a real device (`npx expo run:ios` or TestFlight) —
      **not** Expo Go (native modules won't load there).

## 1. Auth

- [ ] Email sign-up with a valid address creates a user (check Supabase
      dashboard) and lands on the Tabs screen.
- [ ] Sign-up validation: short password (<8) and malformed email are blocked
      with inline errors before any network call.
- [ ] Terms checkbox is unchecked by default and blocks submit until ticked.
- [ ] Email sign-in with correct credentials works; wrong password shows the
      server error, not a crash.
- [ ] Sign in with Apple completes and the account shows the Apple email/name
      in Settings.
- [ ] Cancelling the Apple sheet returns to the form with no error toast.
- [ ] Guest ("skip") path still reaches the app with no account.
- [ ] Sign out (Settings → Account) clears the account and returns to guest.
- [ ] Kill + relaunch while signed in restores the session (no re-login).

## 2. Plately+ (IAP)

- [ ] Plus screen loads real offerings with prices from App Store Connect.
- [ ] Sandbox purchase unlocks Plus; the gated extras (Fasting, Goal Phases,
      Coach, Meal Planner) become accessible.
- [ ] **Restore Purchases** re-grants Plus on a fresh install / second device.
- [ ] Entitlement survives relaunch (mirrored into `plusActive` on launch).
- [ ] Cancelling the purchase sheet leaves the user un-subscribed, no error.

## 3. Cloud sync

- [ ] Sign in on device A, log entries / weight / a custom food, background the
      app → rows appear in the Supabase tables (scoped to your `user_id`).
- [ ] Sign in as the same user on device B → the data pulls down and appears.
- [ ] Edit the same entry's grams on both devices; the later edit wins after
      both sync (Last-Write-Wins on `updated_at`).
- [ ] Delete an entry on device A → it disappears on device B after sync
      (tombstone propagation).
- [ ] Sign in as a brand-new account after using guest mode → existing local
      (guest) data uploads on first sync.
- [ ] Sign out, sign in as a *different* account → device A does not show the
      first account's rows (cursor reset + RLS scoping).
- [ ] Airplane mode: writes still work locally; sync catches up on reconnect /
      next foreground.

## 4. Local notifications

- [ ] Toggling Reminders on in Settings prompts for notification permission.
- [ ] Granting permission schedules the enabled nudges (meals / water / streak).
- [ ] A scheduled reminder actually fires at its time (set one to the next
      minute to test quickly).
- [ ] Toggling Reminders off cancels all scheduled notifications.
- [ ] Denying permission leaves the app working; no scheduled reminders, no
      crash.

## 5. Graceful degradation (sanity)

- [ ] Temporarily blank the `.env` keys and rebuild → app runs local/guest,
      Plus screen offers the `__DEV__` unlock, no auth/sync errors surface.
