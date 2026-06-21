# Plately — Architecture Overview

A plain-English walkthrough of how the app is built, what every layer does,
and how data flows from the moment you open the app to the moment it syncs
to the cloud.

---

## The Big Picture

Plately is a **React Native (Expo) iOS app**. Everything important happens on
the device — food recognition, nutrition tracking, and local storage all work
with no internet. The cloud (Supabase) is optional: it backs up your data and
lets you restore it on a new device. RevenueCat manages the Plately+
subscription. There is no custom server — just the device, Supabase, and
RevenueCat.

```
┌─────────────────────────────────────────┐
│                Your iPhone              │
│                                         │
│  UI (React Native screens)              │
│      ↕                                  │
│  State (Zustand stores)                 │
│      ↕                                  │
│  Local DB (SQLite — always works)       │
│      ↕ (when signed in + online)        │
│  Sync Engine                            │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
   Supabase          RevenueCat
 (your data)       (subscription)
```

---

## App Startup — What Happens When You Open the App

**File:** `App.tsx` → `src/bootstrap.ts`

1. **Fonts load** — Space Grotesk + JetBrains Mono are loaded before anything
   renders. A spinner shows until they're ready.

2. **Settings hydrate** — Zustand reads your saved preferences (goals, units,
   accent color, Plus status) from AsyncStorage. The app is unusable until
   this finishes (the `hydrated` flag gates the UI).

3. **Services bootstrap** (from `bootstrap.ts`):
   - **Auth listener** starts — checks if you have a saved Supabase session.
     If yes, it logs you in silently and kicks off a sync.
   - **RevenueCat configures** — checks your subscription status. If you're
     a Plus subscriber, it unlocks Plus features immediately.
   - **Reminder schedule applies** — re-registers your local notification
     reminders (daily meal / water reminders you set in Settings).
   - **Foreground hook registers** — every time the app comes back from the
     background, a sync runs to catch up with the cloud.

4. **ML model warms up** — the on-device food recognition model loads into
   memory in the background so your first photo scan is fast.

5. **Navigation renders** — if onboarding is complete, you land on the Today
   tab. If not, the Onboarding screen shows first.

---

## The Layers

### 1. UI — Screens & Components

**Location:** `src/screens/`, `src/components/`

Plain React Native. Each screen is a function component. No class components.
Screens read from state stores and call db functions — they don't talk to
Supabase directly. The navigation stack is in `src/navigation/RootNavigator.tsx`.

**Tab structure:**
- **Today** (`HomeScreen`) — log meals, water, see daily totals
- **Insights** (`InsightsScreen`) — trends, streaks, weekly averages
- **History** (`HistoryScreen`) — browse past days
- **Settings** (`SettingsScreen`) — goals, units, account, Plus

**Modal/stack screens** (pushed on top of tabs):
- Camera → Analyze → Confirm (the photo-to-log flow)
- Search → Confirm (the text-search-to-log flow)
- Auth, PlatelyPlus, Weight, Fasting, GoalPhases, Coach, MealPlanner, and more

---

### 2. State — Zustand Stores

**Location:** `src/state/`

Zustand is a lightweight state manager. Think of stores as shared memory that
any component can read or write. State is persisted to AsyncStorage so it
survives app restarts.

| Store | What it holds |
|-------|--------------|
| `useSettings` | Goals, units, accent color, account info, Plus status, reminders |
| `useDiary` | A revision counter — bumped after any meal log change so screens re-fetch |
| `useFasting` | Active fast timer state |
| `useQuickAdd` | Temporary state for the quick-add flow |
| `usePlus` | Derived: reads `plusActive` from settings, checks entitlement |

**Why Zustand and not Redux?** Simpler API, less boilerplate, works great with
React hooks. The stores are tiny — no reducers, no actions, just state + setters.

---

### 3. Local Database — SQLite

**Location:** `src/db/`

Every piece of user data lives in a SQLite database on the device first.
The cloud is always secondary. This means the app works offline with zero
degradation.

| File | Table | What it stores |
|------|-------|---------------|
| `database.ts` | `entries` | Every food/water you've logged |
| `weights.ts` | `weights` | Your daily weigh-ins |
| `customFoods.ts` | `custom_foods` | Foods you've created yourself |
| `favorites.ts` | `favorites` | Pinned foods for quick access |
| `fasting.ts` | `fasting_sessions` | Fasting start/end times |
| `mealPlan.ts` | `plan_items` | Pre-planned meals |
| `phases.ts` | `goal_phases` | Cut/bulk/maintain phases |

**How writes work:** Every write function (add, update, delete) operates on
SQLite first. The sync engine handles getting it to the cloud — db files
don't talk to Supabase directly.

---

### 4. Data — Food Database & Nutrition

**Location:** `src/data/`

- `foods.json` — a bundled database of ~1,000 common foods with nutrition per
  100g. Ships inside the app, no network needed.
- `nutrients.ts` — the `Nutrition` type and default values used everywhere.
- `catalog.ts` — merges the built-in food list with your custom foods so
  search returns both.

---

### 5. On-Device AI — Food Photo Recognition

**Location:** `src/ml/`

When you photograph a meal, the image never leaves your phone. A TensorFlow
Lite model (Food-101 classifier, 101 food categories) runs entirely on-device
using Apple's CoreML hardware acceleration.

**Flow:**
1. You take a photo (`CameraScreen`)
2. `recognizer.ts` runs the image through the model
3. Top predictions come back as food names + confidence scores
4. You land on `AnalyzeScreen` — pick a match or correct it
5. Confirm portion size → logged to SQLite

The model downloads once from a GitHub Release asset on first use, then
works fully offline forever. If the download hasn't happened yet, the app
falls back to manual text search.

---

### 6. Auth — Sign In / Sign Up

**Location:** `src/auth/`

Authentication is optional. The app works fully without an account (guest
mode). An account unlocks cloud backup and multi-device sync.

**Sign-in methods:**
- Email + password (Supabase Auth)
- Sign in with Apple (native iOS flow → Supabase)

**Files:**
- `client.ts` — the single Supabase client, shared by auth and sync.
  Returns `null` if keys aren't configured (app runs guest-only).
- `actions.ts` — `signUpWithEmail`, `signInWithEmail`, `signInWithApple`,
  `signOut`. Each returns `{ error }` — never throws.
- `useAuth.ts` — subscribes to Supabase auth events. On `SIGNED_IN`:
  mirrors user info into settings, kicks off a sync. On `SIGNED_OUT`:
  clears account info, resets sync cursors.
- `validation.ts` — client-side checks (email format, password length)
  that run before any network call.

**Session persistence:** Supabase stores the session token in AsyncStorage.
On cold start, the auth listener restores it automatically — you stay logged
in between launches.

---

### 7. Cloud Sync — Getting Data to Supabase

**Location:** `src/sync/`

The sync engine is what copies your local SQLite data to the cloud (and
back down on a new device). It only runs when you're signed in.

**Strategy: Last-Write-Wins (LWW)**
Every row carries an `updated_at` timestamp (epoch ms). When the same row
exists on two devices, whichever has the higher `updated_at` wins. On an
exact tie, the remote (cloud) wins.

**Deleted rows aren't deleted** — they're "tombstoned": the `deleted` column
is set to `true` and the row stays in both databases. This is how a delete
on device A disappears on device B after sync.

**Files:**
- `registry.ts` — the list of all 7 synced tables and their columns.
  Adding sync to a new table = adding one entry here.
- `engine.ts` — orchestrates a full push/pull cycle. Re-entrant safe
  (a second call while one is running is a no-op). Per-table cursors in
  AsyncStorage mean each pull only fetches rows newer than the last sync.
- `local.ts` — reads/writes local SQLite for the sync engine.
- `remote.ts` — reads/writes Supabase for the sync engine.
- `merge.ts` — pure conflict resolution logic (no DB, no network — just
  timestamp comparisons). Fully unit tested.

**When sync runs:**
1. On sign-in
2. Every time the app returns to the foreground
3. Manually via "Sync now" (if surfaced in UI)

---

### 8. Subscription — Plately+

**Location:** `src/iap/purchases.ts`

RevenueCat sits between the app and Apple's payment system. You configure
your subscription products once in App Store Connect + RevenueCat, and the
app just asks "does this user have the `plus` entitlement?" — it never
handles money directly.

**Flow:**
1. App starts → RevenueCat configures with your iOS key
2. Pulls `CustomerInfo` → checks `entitlements.active['plus']`
3. Mirrors result into `useSettings.plusActive`
4. All Plus-gated features check `usePlus()` from that store

**When the user buys:**
1. `PlatelyPlusScreen` fetches available packages from RevenueCat
2. User taps "Subscribe" → native Apple payment sheet
3. RevenueCat confirms the purchase → calls `applyCustomerInfo`
4. `plusActive` flips to `true` → features unlock instantly

**Restore Purchases** button re-fetches `CustomerInfo` — required by
App Store guidelines.

---

### 9. Notifications — Local Reminders

**Location:** `src/notifications/`

All notifications are local (scheduled on-device). There is no push
notification server.

- `schedule.ts` — computes the list of daily reminders from your preferences
  (meal reminders, water reminders, weigh-in reminder)
- `notifications.ts` — clears all scheduled notifications and re-registers
  the new schedule. Called after onboarding and on any settings change.

---

### 10. Environment & Config

**Location:** `src/config/env.ts`, `.env`, `app.config.js`

Secrets (Supabase URL/key, RevenueCat key) live in `.env`. At build time,
`app.config.js` reads `.env` and injects the values into `expo.extra`.
At runtime, `env.ts` reads them back via `expo-constants`.

**Key principle:** every integration checks `isSupabaseConfigured()` or
`isPurchasesConfigured()` before doing anything. Missing keys = feature
disabled gracefully. The app always works without any keys.

---

## Full Data Flow — Logging a Meal

Here's the complete path when you photograph a meal:

```
1. CameraScreen          — you take a photo
2. recognizer.ts         — TFLite model runs on-device, returns top food matches
3. AnalyzeScreen         — you pick the right match
4. ConfirmFoodScreen     — you confirm portion size (grams)
5. database.ts           — entry written to local SQLite immediately
6. useDiary.bump()       — revision counter increments → HomeScreen re-renders
7. sync/engine.ts        — on next foreground or background trigger, entry
                           pushed to Supabase (if signed in + online)
8. Supabase RLS          — entry stored under your user_id, invisible to others
```

If you're offline at step 7, the entry sits in SQLite. The next time the app
comes to the foreground with a connection, the engine picks it up and pushes it.

---

## Security Model

- **RLS (Row Level Security)** on every Supabase table — you can only ever
  read or write rows where `user_id = auth.uid()`. Even if someone got your
  anon key, they couldn't read your data.
- **Anon key only** — the Supabase service role key (which bypasses RLS) is
  never in the app.
- **Photos never leave the device** — the ML model runs locally. No image is
  uploaded anywhere.
- **No tracking** — no analytics SDK, no ad network, no third-party data
  collection.
- **Local-first** — even if Supabase went down permanently, you'd lose nothing.
  All your data stays in SQLite on your phone.

---

## What's Not Built Yet

| Feature | Blocker |
|---------|---------|
| Plately+ IAP (real purchases) | Need Apple Developer account + App Store Connect subscription products + RevenueCat product config |
| Sign in with Apple | Need Apple Developer account + App ID capability enabled |
| Production build / App Store submit | Need Apple Developer account + `eas build` |
| Device test (auth, sync, IAP) | Need cord + dev build on real device |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK) |
| Language | TypeScript |
| Navigation | React Navigation (native stack + bottom tabs) |
| State | Zustand + AsyncStorage |
| Local DB | expo-sqlite (SQLite) |
| Cloud DB | Supabase (Postgres + Auth + RLS) |
| Sync | Custom LWW engine (src/sync/) |
| Subscription | RevenueCat + react-native-purchases |
| AI / ML | TensorFlow Lite via react-native-fast-tflite (CoreML on iOS) |
| Notifications | expo-notifications (local only) |
| Build / Deploy | EAS Build + EAS Submit |
