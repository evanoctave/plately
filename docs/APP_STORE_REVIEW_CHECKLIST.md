# App Store Review Guidelines — compliance checklist

How Plately addresses the guidelines most relevant to a photo + health app.
References are to Apple's App Store Review Guidelines.

## 1. Safety

- **1.1 Objectionable content** — none; the app only logs food.
- **1.4 Physical harm / health** — Plately is explicitly **not** a medical
  device. A medical disclaimer appears in onboarding, Settings, and the privacy
  policy. It gives approximate estimates only and never diagnoses or prescribes.
- **1.5 Developer information** — support contact provided (email).

## 2. Performance

- **2.1 App completeness** — fully functional with no placeholder content; no
  login walls. Works offline (manual search) even before the model downloads.
- **2.3 Accurate metadata** — features described match behavior. The model is
  on-device; the only network call is a one-time model download (disclosed).
- **2.5.1 Software requirements** — uses only public APIs (Expo/React Native).
  Downloads **model weights (data)**, not executable code, which is permitted.

## 3. Business

- **3.1 Payments** — the core tracker is **free**. **Plately+** is an optional
  auto-renewable subscription sold through Apple IAP (via RevenueCat); no
  external payment links. The paywall (`PlatelyPlusScreen`) states what's free
  vs. Plus, exposes **Restore Purchases**, and links to the **EULA** and
  **Privacy Policy** — both required by 3.1.2.

## 4. Design

- **4.0 / 4.1** — original UI, no copycat branding.
- **4.2 Minimum functionality** — substantial native functionality: on-device
  ML, camera, local database, history, goals, water tracking.
- **4.5 Apple sites/services** — none misused.

## 5. Legal

- **5.1.1 Data collection & storage** — the app works fully **local / guest**
  with no account. If the user **signs in** (email, Apple or Google) to enable
  cloud sync, we collect their **email**, **user id**, and the **diary they
  choose to back up** (food logs, weights, custom foods, plans, goal phases),
  stored in Supabase under per-user Row-Level Security. Declared in the App
  Privacy label as **Linked to the user**, used for **App Functionality**, **not**
  for tracking. Photos never leave the device.
- **5.1.1(i) Privacy policy** — provided (`docs/PRIVACY_POLICY.md`), linked from
  within the app (Settings + paywall) and App Store Connect.
- **5.1.1(v) Account deletion** — **Settings → Account → Delete account**
  (signed-in state) permanently deletes the Supabase auth user and, by ON DELETE
  CASCADE, every row they own (`supabase/functions/delete-account`). "Erase all
  data" separately wipes the local diary; deleting the app removes local data.
- **5.1.2 Data use & sharing** — no data is sold or used for tracking; the only
  third-party data processor is Supabase (auth + sync backend), governed by RLS.
  Outbound calls: (a) cloud sync of the signed-in user's diary, (b) a one-time
  model-weights download, (c) user-initiated barcode lookups that send only the
  barcode digits to Open Food Facts. RevenueCat handles subscription state.
- **5.1.5 Location** — not used.

## Permissions (Info.plist)

All declared with clear, specific purpose strings in `app.json`:

- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`

## App Tracking Transparency

Not applicable — the app performs **no** tracking and does not access the IDFA,
so no ATT prompt is required.

## Privacy "nutrition label" summary

Reflects the shipping build with cloud sync + accounts enabled. Everything below
is **only** collected once the user signs in; guest mode collects nothing.

| Question | Answer |
|----------|--------|
| Data used to track you | None |
| Data linked to you | Email; Health & Fitness (food/weight logs); User Content (custom foods, plans, goals); User ID |
| Data not linked to you | None |
| Data collected | Email, User ID, Health & Fitness, User Content — for App Functionality only |

## Known reviewer notes to include

> Plately's core tracker is free and works offline; food recognition runs
> on-device via a TensorFlow Lite model whose weights download once from a
> public CDN (data only, no code). Signing in is **optional** and enables cloud
> backup/sync of the user's own diary to Supabase (per-user Row-Level Security);
> the account and all its data can be deleted in-app from Settings → Delete
> account. Plately+ is an optional auto-renewable subscription. Optional barcode
> scanning sends only the barcode number to Open Food Facts. Photos never leave
> the device. Nutrition values are approximate and the app is not a medical
> device.
