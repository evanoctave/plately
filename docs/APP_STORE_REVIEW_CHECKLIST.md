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

- **3.1 Payments** — the app is **free** with **no** in-app purchases,
  subscriptions, ads, or external payment links. Nothing to monetize, nothing
  to review under IAP rules.

## 4. Design

- **4.0 / 4.1** — original UI, no copycat branding.
- **4.2 Minimum functionality** — substantial native functionality: on-device
  ML, camera, local database, history, goals, water tracking.
- **4.5 Apple sites/services** — none misused.

## 5. Legal

- **5.1.1 Data collection & storage** — **no data collected**. App Privacy
  label set to "Data Not Collected."
- **5.1.1(i) Privacy policy** — provided (`docs/PRIVACY_POLICY.md`), linked from
  within the app (Settings) and App Store Connect.
- **5.1.1(v) Account deletion** — no account exists; "Erase all data" removes
  all local data, and deleting the app removes everything.
- **5.1.2 Data use & sharing** — nothing is shared; no third-party SDKs. The
  only outbound calls are (a) a one-time model-weights download and (b)
  user-initiated barcode lookups that send just the barcode digits to Open
  Food Facts. Neither transmits personal data.
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

| Question | Answer |
|----------|--------|
| Data used to track you | None |
| Data linked to you | None |
| Data not linked to you | None |
| Data collected | **None** |

## Known reviewer notes to include

> Plately is free, account-free, and works offline. Food recognition runs
> on-device via a TensorFlow Lite model whose weights download once from a
> public CDN (data only, no code). Optional barcode scanning sends only the
> scanned barcode number to Open Food Facts (a free public database) to fetch
> nutrition facts. No personal data is collected or transmitted. Nutrition
> values are approximate and the app is not a medical device.
