# App Store submission guide

This app is built so that it can pass App Store review. Submitting still
requires **your** Apple Developer account and a build machine (a Mac, or EAS
Build in the cloud). This guide walks through it.

> You cannot submit to the App Store from this repo alone — Apple requires a
> paid Apple Developer Program membership ($99/yr) and code signing. The app
> itself remains **free to use** for end users; that fee is Apple's, not the
> app's.

## 1. Prerequisites

- Apple Developer Program membership.
- Node 18+ and the Expo tooling: `npm i -g eas-cli`.
- `npm install` in this repo.
- A configured on-device model (`docs/MODEL.md`) — optional for review, since
  the app degrades gracefully, but recommended so the headline feature works.

## 2. Configure identifiers

- `app.json` → `expo.ios.bundleIdentifier` (`com.evanoctave.plately`). Change
  to a bundle ID you own.
- Create the App ID and an app record in App Store Connect.
- Run `eas init` to set `expo.extra.eas.projectId`.
- If you ship cloud sync: enable the **Sign in with Apple** capability on the
  App ID (`app.config.js` already sets `ios.usesAppleSignIn` and adds the
  `expo-apple-authentication` plugin).
- If you ship Plately+: create your auto-renewable subscription products in App
  Store Connect and link them in RevenueCat. Copy the keys into `.env` (see the
  README "Accounts, sync & Plately+" section) before building.

> Both integrations are optional at build time. With no keys in `.env`, the app
> ships local-only and account-free, and the privacy label below stays "Data
> Not Collected."

## 3. Build

```bash
eas login
eas build --platform ios --profile production
```

EAS handles provisioning profiles and signing. The output is an `.ipa`.

## 4. Submit

```bash
eas submit --platform ios --latest
```

## 5. App Store Connect metadata

- **Privacy Policy URL**: host `docs/PRIVACY_POLICY.md` (e.g. GitHub Pages) and
  paste the URL.
- **App Privacy ("Nutrition Label")**: depends on whether you ship cloud sync.
  - **Local-only build** (no Supabase keys): select **"Data Not Collected"**.
  - **With optional accounts + sync**, declare (all **Linked to the user**, used
    for **App Functionality**, **not** used for tracking):
    - **Contact Info → Email Address** — captured on sign-up / read from Apple.
    - **Health & Fitness** — the diary you choose to back up (food logs,
      weights). Only leaves the device after the user signs in.
    - **User Content** — custom foods, meal plans, goal phases.
    - Photos are **not** collected — image files never leave the device.
- **Age rating**: complete the questionnaire (no objectionable content).
- **Category**: Health & Fitness.
- **Subscriptions (Plately+)**: if shipping IAP, add the auto-renewable
  subscription group, localized descriptions, and a screenshot. The paywall
  exposes **Restore Purchases** (App Review requires it). State clearly what's
  free vs. Plus — the core tracker is free; Plus unlocks the extras + sync.
- **Encryption**: `ITSAppUsesNonExemptEncryption = false` is already set in
  `app.json` (only standard HTTPS is used), so no export compliance docs are
  required.
- **Demo**: the app is fully functional offline and account-free, so a demo
  account is not strictly required — note this in "Review Notes." If you ship
  cloud sync and want the reviewer to exercise it, provide a test account and
  steps. For IAP, the reviewer uses the sandbox automatically.

## 6. Required assets

- App icon `1024×1024` (no alpha) — `assets/icon.png`.
- Screenshots for required device sizes. As of 2024+ App Store Connect accepts a
  single **6.9"/6.7"** set (iPhone 17/15 Pro Max); add a **6.5"** set only if
  you target older hardware.

### Capturing screenshots

A helper drives the iOS Simulator and saves device-native PNGs into
`assets/store/screenshots/` (exactly the resolution App Store Connect wants):

```bash
npx expo run:ios                              # build + boot the simulator once
scripts/screenshots.sh boot "iPhone 17 Pro Max"
# tap through to each screen, then:
scripts/screenshots.sh shot home
scripts/screenshots.sh shot confirm
scripts/screenshots.sh shot insights
scripts/screenshots.sh shot privacy
```

`scripts/screenshots.sh tap <fx> <fy>` can click the Simulator by fractional
coordinates if you want to script the walkthrough (keep Simulator frontmost).

### Suggested screens + captions

| Screen | Caption |
|--------|---------|
| Home (a few meals + water logged) | "Your whole day at a glance" |
| Camera / Analyze | "Snap a meal — recognized on your device" |
| Confirm food (macros + micros) | "Calories, macros & micros for every food" |
| Insights | "Trends, streaks & daily averages — free" |
| Settings ("Free forever") | "Everything other apps charge for — $0" |

See `docs/APP_STORE_REVIEW_CHECKLIST.md` for the guideline-by-guideline review.
