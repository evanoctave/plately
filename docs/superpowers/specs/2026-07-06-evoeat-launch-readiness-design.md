# EvoEat Launch Readiness — Design

Date: 2026-07-06
Status: Approved approach A (security-first, sequential phases, one branch)

## Goal

Get the app (rebranding Plately → EvoEat, name-only) ready for App Store deployment:
close security gaps, apply new branding assets, add local quality gates, and stand up
a CI/CD pipeline. Work lands as one branch with reviewable commits per phase.

## Scope decisions (locked)

- **Rebrand depth**: display name + user-visible strings + icons only. Bundle ID
  (`com.evanoctave.plately`), slug (`plately`), URL scheme (`plately`), EAS project ID,
  RevenueCat entitlement IDs, and persisted storage keys are **unchanged**. Renaming
  identifiers pre-launch risks breaking App Store Connect records, OAuth redirect
  registration, and existing TestFlight installs for zero user-facing benefit.
- **App icon**: `icon-1a-classic-1024.png` (white mascot on emerald) from the assets zip.
- **CI/CD**: GitHub Actions with PR checks plus EAS build workflow. TestFlight
  auto-submit wired but disabled until the Apple Developer license is verified.
- **Dev environment**: pre-commit hooks only (no local Supabase stack, no husky).

## Phase 1 — Security audit + fixes

Audit the following, produce a findings table (severity, file:line, fix), then commit
fixes one concern per commit. Anything requiring dashboard/manual action goes in a
user-action list at the end.

1. **Auth flows** (`src/auth/*`)
   - OAuth callback and deep-link handling: custom scheme `plately://` is spoofable on
     iOS, so verify PKCE flow is used and callback URL/state validation is strict.
   - Session/token storage: check whether Supabase session lands in AsyncStorage
     (unencrypted) vs SecureStore/Keychain; migrate if needed.
   - Input validation on email/password paths (`src/auth/validation.ts`).
2. **Supabase edge function** (`supabase/functions/delete-account/index.ts`)
   - JWT required and verified; CORS restricted (no wildcard regression); no
     service-role key leakage to client-observable surfaces.
3. **Supabase backend posture** (`supabase/migrations/*.sql`)
   - RLS enabled on every table; policies scoped to `auth.uid()`; no broad grants to
     `anon`/`authenticated` beyond what screens need.
4. **Secrets hygiene**
   - Confirm `.env` and `supabase/.temp` are gitignored and absent from history.
   - Scan full git history for leaked keys (older keys were swapped in commit 648beaf;
     verify old values are dead and no new ones snuck in).
   - `src/config/env.ts`: fail-fast behavior when keys are missing.
5. **Dependencies**
   - `npm audit`; patch high/critical where the fix does not force an Expo SDK bump.
     SDK upgrades are out of scope pre-launch; unpatchable items get documented.
6. **Client hardening**
   - `src/state/usePlus.ts` entitlement check (jailbreak workaround fix landed in
     648beaf — verify it holds).
   - Local SQLite diary data: confirm nothing sensitive beyond nutrition entries.

**Exit criteria**: findings table produced; all fixable items committed; user-action
list delivered (e.g., key rotation confirmation, Supabase dashboard settings).

## Phase 2 — Rebrand (name-only)

- `app.json`: `expo.name` → `EvoEat`; all `infoPlist` permission strings and plugin
  permission strings reworded "Plately …" → "EvoEat …".
- Icons: `assets/icon.png` and `assets/adaptive-icon.png` replaced from
  `icon-1a-classic-1024.png`. Check `scripts/gen-assets.mjs` first — if it generates
  icon/splash from a source image, use it. If it cannot regenerate the splash, the
  existing splash image is kept unchanged (icon-only swap); no hand-drawn splash.
- `src/` user-visible strings: "Plately" → "EvoEat", "Plately Plus" → "EvoEat+"
  (display text only; `PlatelyPlusScreen` filename, route names, entitlement IDs,
  zustand storage keys stay).
- Docs: README and PRODUCT.md titles/references updated.

**Exit criteria**: `grep -ri plately src/ app.json` returns only identifiers
(scheme, bundle ID, storage keys, route/file names), no user-visible copy.

## Phase 3 — Pre-commit hook

- Checked-in `.githooks/pre-commit` (shell script): `tsc --noEmit`, eslint on staged
  `.ts/.tsx`, secret-pattern regex scan on staged diff (Supabase keys `sb_secret_`,
  JWTs, `sk_`/API-key shapes).
- Wired via `git config core.hooksPath .githooks` executed from an npm `prepare`
  script, so `npm install` activates it. README gains a one-line note.
- No husky dependency.

**Exit criteria**: commit with a planted fake secret is rejected locally; clean
commit passes.

## Phase 4 — CI/CD (GitHub Actions)

- `.github/workflows/ci.yml` — on PRs and pushes to main: checkout, Node 20 setup
  with npm cache, `npm ci`, typecheck, lint, `jest`, `npm audit --audit-level=high`,
  gitleaks history scan.
- `.github/workflows/eas-build.yml` — on `workflow_dispatch` and `v*` tags:
  `eas build --platform ios --profile production --non-interactive` using
  `EXPO_TOKEN` secret. `--auto-submit` present but commented/gated off until Apple
  Developer license verified.
- User action: create Expo access token, add as `EXPO_TOKEN` repo secret (exact
  steps provided at handoff).

**Exit criteria**: ci.yml green on the launch-readiness branch; eas-build.yml
syntax-validated (actual build run deferred to user since it consumes EAS build
quota).

## Testing strategy

- Phases 1–2: `npm run typecheck`, `npm run lint`, `npm test` after each commit;
  manual smoke of auth flow in simulator if auth code changes.
- Phase 3: planted-secret rejection test, clean-commit pass test.
- Phase 4: push branch, observe Actions run.

## Error handling / risks

- Dependency fixes that would force an Expo SDK major bump: documented, not applied.
- Any security finding requiring backend changes I cannot verify locally (live RLS
  state, key rotation) goes on the user-action list rather than being assumed fixed.
- Rebrand regressions guarded by the grep exit criterion and simulator smoke test.

## Out of scope

- Bundle ID / slug / scheme rename, Android release prep, Apple Sign-In enablement
  (blocked on paid license), App Store Connect uploads (screenshots/marketing from
  zip are uploaded by user), local Supabase Docker stack.
