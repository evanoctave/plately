# Plately Privacy Policy

_Last updated: 2026-06-20_

Plately is designed to be private by default. This policy explains, in plain
language, what the app does and does not do with your information.

## The short version

- **Your photos never leave your device.** Food recognition runs entirely
  on-device, always.
- **The app works fully without an account, and we collect nothing in that
  mode.** Your food diary stays only on your device.
- **An account and cloud sync are optional and opt-in.** If you choose to sign
  in, your account email and the diary data you log are stored in our backend so
  they can be backed up and synced across your devices. You can stay account-free
  forever.
- **We never sell your data, and we do not track you** (no analytics, no ads, no
  advertising identifier).
- Beyond optional sync, the app makes network requests in only a few cases:
  1. A **one-time download** of the open-source recognition model.
  2. **Barcode lookups you initiate**, which send only the scanned barcode
     number to Open Food Facts (a free, open product database).
  3. If you subscribe to **Plately+**, the purchase is processed by Apple and
     our subscription provider (RevenueCat); we never see your card details.

## What data the app handles

| Data | Where it lives | Leaves your device? |
|------|----------------|---------------------|
| Meal photos you capture | On-device only | **No — never** |
| Food diary entries (foods, portions, water) | On-device SQLite database | Only if you sign in (then synced to your account) |
| Daily goals & preferences | On-device storage | No |
| Account email & name | Your device + our backend (only if you sign in) | Yes, when you create an account |
| Recognition model file | Downloaded once from a public CDN, cached on-device | Download only; no personal data sent |
| Barcode number (when you scan) | Sent to Open Food Facts for lookup | Only the barcode digits; no personal data |

## Camera & photo library

Plately requests camera access so you can photograph meals, and (optionally)
photo-library access so you can analyze an existing photo. These images are
processed on your device to estimate nutrition and are stored locally only if
you save the corresponding diary entry. They are never uploaded.

## Optional account & cloud sync

By default the app has no account and your diary never leaves your device. If
you choose to **create an account** (email or Sign in with Apple), we store your
email and the diary data you log — food entries, weights, custom foods,
favorites, fasting sessions, meal plans, and goal phases — in our backend
(Supabase) so it can be backed up and synced to your other devices. Each user's
data is access-controlled so only that signed-in user can read or write it.
**Your meal photos are never uploaded**, even with an account — only the diary's
text data syncs. Sign out at any time, or use the app entirely account-free.

## Subscriptions

**Plately+** is an optional subscription that unlocks extra features. Purchases
are handled by Apple's In-App Purchase and our subscription provider
(RevenueCat); we never receive your payment details. The free core of the app
never requires a subscription.

## No tracking, no analytics, no ads

Plately contains no third-party analytics SDKs, no advertising SDKs, and no
tracking technologies. We do not use the Advertising Identifier (IDFA) and do
not engage in App Tracking Transparency–covered tracking.

## Data deletion

You are always in control. **Settings → Erase all data** permanently deletes
every diary entry from your device. Deleting the app removes all locally stored
data, including cached photos and the downloaded model. If you created an
account, you can request deletion of your synced data by contacting us at the
address below; we will remove your account and its data from our backend.

## Children's privacy

Plately is not directed to children under 13 and we do not knowingly collect
personal information (such as an account email) from them. The core app can be
used with no account at all.

## Medical disclaimer

Plately provides **approximate** nutrition estimates for general wellness and
informational purposes only. It is **not a medical device** and does not
provide medical, dietary, or nutritional advice, diagnosis, or treatment.
Always consult a qualified healthcare professional regarding your diet and
health.

## Changes to this policy

If this policy changes, the updated version will be published at this URL with a
revised "Last updated" date.

## Contact

Questions about privacy? Contact: evanoctav3@gmail.com
