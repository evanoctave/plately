# 📸 Plately

Photo-first nutrition tracking that costs **$0 to run** — including the AI.

Take a picture of your food and get an estimate of its **calories, macros
(protein/carbs/fat), micronutrients (sodium, potassium, calcium, iron,
magnesium, vitamins A/C/D) and water content**. The recognition runs **on your
device** and your **photos never leave your phone**.

The whole core app is **free and works fully offline with no account**. Two
things are optional and opt-in: a **free account** (to back up and sync your
diary across devices) and **Plately+** (a subscription that unlocks the extras —
Fasting, Goal Phases, Coach, Meal Planner — and cloud sync). Skip both and
nothing changes.

Built with **Expo / React Native** and structured to pass App Store review.

---

## Why it's free (including the AI)

| Concern | How Plately stays $0 |
|---------|------------------------|
| Image recognition | Runs **on-device** with a TensorFlow Lite model (no inference servers, no per-call cost). |
| Barcode lookups | **Open Food Facts** — free, open, key-less product API. |
| Nutrition data | Bundled database derived from **USDA FoodData Central** (public domain). |
| Storage | Local-first SQLite. The free, account-free app has **no backend and no cloud bill**. |
| Optional sync | Supabase free tier (Postgres + auth). Only used if a user signs in; the diary's text data syncs, photos stay on-device. |
| Model hosting | One-time download of static weights from a free CDN (GitHub Releases / Hugging Face). |

The only money involved in *shipping* to the App Store is Apple's $99/yr
developer fee — that's Apple's, not the app's, and end users pay nothing.

## Features

- 📷 **Snap a meal** — on-device food recognition with top-3 suggestions.
- 🏷️ **Barcode scanning** — free product lookup via Open Food Facts (no key).
- 🔎 **Manual search** — fast fuzzy search over the food database (works even
  offline / before the model downloads).
- ✏️ **Custom foods** — create your own foods once and reuse them forever.
- ⭐ **Favorites & recents** — one-tap quick-add of foods you log often.
- 🍽️ **Full breakdown** — calories, macros, fiber, sugar, water, and 8
  micronutrients with % of Daily Value.
- 📊 **Insights** — 14-day trends, logging streak, and daily averages.
- 🧮 **Personalized goals** — calorie/macro/water targets from your body
  metrics (Mifflin–St Jeor), or set them manually.
- 🎯 **Daily goals** — calories, macros, and water, all editable.
- 💧 **Water tracking** — quick-add with mL/oz units.
- 📅 **History** — per-day totals and detail view.
- 📤 **CSV export** — your data is yours; export the whole diary any time.
- ☁️ **Optional cloud sync** — sign in (email or Apple) to back up and sync your
  diary across devices. Off by default; the app is fully usable without it.
- 🔔 **Local reminders** — opt-in meal / water / streak nudges, scheduled
  on-device (no push server).
- ✨ **Plately+** — optional subscription unlocking Fasting, Goal Phases, Coach,
  Meal Planner, and cloud sync. The core tracker stays free.
- 🔒 **Private** — account is optional, no analytics, no tracking. "Erase all
  data" any time.

## How it's different from the paid trackers

Mainstream trackers (MyFitnessPal, Lose It!, etc.) gate core features behind
subscriptions. Plately gives them all away — free, offline, account-free:

| Feature | Typical paid app | Plately |
|---------|------------------|-----------|
| Photo food recognition | Premium | **Free** (on-device) |
| Barcode scanning | Often premium | **Free** (Open Food Facts) |
| Create custom foods | Limited / premium | **Free, unlimited** |
| Macro + micro goals | Premium | **Free** |
| Trends & insights | Premium | **Free** |
| Export your data | Premium | **Free** (CSV) |
| Ads | Yes | **None** |
| Account required | Yes | **No** |

## Tech stack

- Expo SDK 52 / React Native 0.76 (New Architecture)
- `react-native-fast-tflite` for on-device inference + `jpeg-js` for decoding
- `expo-camera`, `expo-image-picker`, `expo-image-manipulator`
- `expo-sqlite` (local diary) + `zustand` (+ AsyncStorage for settings)
- `@react-navigation` (stack + tabs), `react-native-svg` (rings/bars)
- `@supabase/supabase-js` + `expo-apple-authentication` (optional auth & sync)
- `react-native-purchases` / RevenueCat (Plately+ subscription)
- `expo-notifications` (local reminders, no push server)

## Getting started

```bash
npm install
npm run typecheck      # static type check
npm test               # unit tests
npx expo start         # run in a dev client
```

> The camera + on-device model require a **development build** (not Expo Go):
> `eas build --profile development`, or `npx expo run:ios` / `run:android`.

### Accounts, sync & Plately+ (optional)

These integrations are **off until you provide keys** — without them the app
runs in local / guest mode and degrades gracefully. Copy `.env.example` to
`.env` and fill in:

```bash
cp .env.example .env
# SUPABASE_URL / SUPABASE_ANON_KEY   → auth + cloud sync
# REVENUECAT_IOS_KEY                 → Plately+ subscription
```

`app.config.js` reads `.env` and exposes the keys via `expo-constants`;
`src/config/env.ts` gates every integration behind an `isConfigured()` check.

- **Supabase** — create a project, then run the schema in
  `supabase/migrations/0001_init.sql` (CLI `supabase db push`, or paste into the
  SQL editor). Row-Level Security scopes every row to its owner.
- **RevenueCat** — create an iOS app, add a `plus` entitlement, and wire your
  App Store Connect subscription products.

The cloud sync engine replicates the diary's **text data only** (entries,
weights, custom foods, favorites, fasting, meal plan, goal phases) using
Last-Write-Wins on `updated_at`. Photo files stay on the device.

### Wire up the recognition model

The app works immediately in manual-entry mode. To enable photo recognition,
point it at a Food-101 `.tflite` model — see **[docs/MODEL.md](docs/MODEL.md)**.
It downloads once at runtime, then works offline.

## Project structure

```
src/
  ml/          on-device recognizer + labels
  data/        nutrition types + curated USDA food database
  db/          local SQLite persistence
  state/       zustand stores (settings, diary)
  config/      env / secret loading (Supabase + RevenueCat keys)
  auth/        Supabase client, validation, sign-in/up actions, session hook
  iap/         RevenueCat configuration + Plately+ entitlement
  sync/        cloud sync engine (LWW), table registry, local/remote adapters
  notifications/ local reminder schedule + scheduling
  components/  reusable UI (Ring, MacroBars, MicrosGrid, …)
  screens/     Home, Camera, Analyze, Search, Confirm, History, Settings, …
  navigation/  stack + tab navigators
supabase/      SQL migrations for the cloud sync schema (RLS-scoped)
docs/          privacy policy, model setup, App Store submission + checklist
scripts/       model + asset generators
```

## Shipping to the App Store

See **[docs/APP_STORE_SUBMISSION.md](docs/APP_STORE_SUBMISSION.md)** and the
guideline-by-guideline **[review checklist](docs/APP_STORE_REVIEW_CHECKLIST.md)**.

Auth, IAP, sync, and notifications rely on native modules + live backends that
the automated checks can't reach — run the
**[device test checklist](docs/DEVICE_TEST_CHECKLIST.md)** on real hardware
before shipping.

## Disclaimer

Plately gives **approximate** estimates for general wellness only. It is not a
medical device and does not provide medical, dietary, or nutritional advice.
Consult a qualified professional for health decisions.

## License

MIT — see [LICENSE](LICENSE).
