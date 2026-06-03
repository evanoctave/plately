# 📸 Plately

Photo-first nutrition tracking that costs **$0 to run** — including the AI.

Take a picture of your food and get an estimate of its **calories, macros
(protein/carbs/fat), micronutrients (sodium, potassium, calcium, iron,
magnesium, vitamins A/C/D) and water content**. Everything runs **on your
device**: no servers, no API keys, no subscriptions, and your photos never
leave your phone.

Built with **Expo / React Native** and structured to pass App Store review.

---

## Why it's free (including the AI)

| Concern | How Plately stays $0 |
|---------|------------------------|
| Image recognition | Runs **on-device** with a TensorFlow Lite model (no inference servers, no per-call cost). |
| Barcode lookups | **Open Food Facts** — free, open, key-less product API. |
| Nutrition data | Bundled database derived from **USDA FoodData Central** (public domain). |
| Storage / sync | Local-only SQLite. No backend, no cloud bill. |
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
- 🎯 **Daily goals** — calories, macros, and water, all editable.
- 💧 **Water tracking** — quick-add with mL/oz units.
- 📅 **History** — per-day totals and detail view.
- 📤 **CSV export** — your data is yours; export the whole diary any time.
- 🔒 **Private** — no account, no analytics, no tracking. "Erase all data" any
  time.

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

## Getting started

```bash
npm install
npm run typecheck      # static type check
npm test               # unit tests
npx expo start         # run in a dev client
```

> The camera + on-device model require a **development build** (not Expo Go):
> `eas build --profile development`, or `npx expo run:ios` / `run:android`.

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
  components/  reusable UI (Ring, MacroBars, MicrosGrid, …)
  screens/     Home, Camera, Analyze, Search, Confirm, History, Settings, …
  navigation/  stack + tab navigators
docs/          privacy policy, model setup, App Store submission + checklist
scripts/       model + asset generators
```

## Shipping to the App Store

See **[docs/APP_STORE_SUBMISSION.md](docs/APP_STORE_SUBMISSION.md)** and the
guideline-by-guideline **[review checklist](docs/APP_STORE_REVIEW_CHECKLIST.md)**.

## Disclaimer

Plately gives **approximate** estimates for general wellness only. It is not a
medical device and does not provide medical, dietary, or nutritional advice.
Consult a qualified professional for health decisions.

## License

MIT — see [LICENSE](LICENSE).
