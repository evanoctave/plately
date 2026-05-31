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

- `app.json` → `expo.ios.bundleIdentifier` (`com.evanoctave.nutrisnap`). Change
  to a bundle ID you own.
- Create the App ID and an app record in App Store Connect.
- Run `eas init` to set `expo.extra.eas.projectId`.

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
- **App Privacy ("Nutrition Label")**: select **"Data Not Collected"** — the
  app collects nothing. No tracking.
- **Age rating**: complete the questionnaire (no objectionable content).
- **Category**: Health & Fitness.
- **Encryption**: `ITSAppUsesNonExemptEncryption = false` is already set in
  `app.json` (only standard HTTPS is used), so no export compliance docs are
  required.
- **Demo**: no login required, so no demo account is needed. Note in "Review
  Notes" that the app is fully functional offline and account-free.

## 6. Required assets

- App icon `1024×1024` (no alpha) — `assets/icon.png`.
- Screenshots for required device sizes (6.7", 6.5", 5.5" as applicable).
  Generate by running the app and capturing the Home, Camera, Analyze, and
  Confirm screens.

See `docs/APP_STORE_REVIEW_CHECKLIST.md` for the guideline-by-guideline review.
