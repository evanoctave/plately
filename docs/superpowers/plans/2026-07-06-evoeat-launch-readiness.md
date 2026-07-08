# EvoEat Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship-ready EvoEat (name-only rebrand of Plately): security fixes landed, brand assets applied, pre-commit gates active, GitHub Actions CI/CD in place.

**Architecture:** Sequential phases on one branch. Phase 1 fixes audited security findings (PKCE OAuth, encrypted session storage, dep hygiene, repo hygiene). Phase 2 applies the rebrand (strings + icons only — identifiers untouched). Phase 3 adds a checked-in pre-commit hook. Phase 4 adds GitHub Actions (checks + EAS build).

**Tech Stack:** Expo SDK 52 / React Native 0.76, supabase-js v2, expo-secure-store + aes-js + expo-crypto (new), Jest, GitHub Actions, EAS.

**Spec:** `docs/superpowers/specs/2026-07-06-evoeat-launch-readiness-design.md`

**Audit verdicts already confirmed (no task needed):** delete-account edge function (JWT verified, CORS locked), RLS owner policies on all 7 tables, no secrets in git history, `__DEV__`-gated dev unlock, `.env`/`supabase/.temp` gitignored.

---

## Phase 1 — Security fixes

### Task 1: Force PKCE OAuth, remove implicit-flow fallback

**Files:**
- Modify: `src/auth/client.ts:16-24`
- Modify: `src/auth/actions.ts:74-113`

- [x] **Step 1: Set PKCE flow in the Supabase client**

In `src/auth/client.ts`, replace the `createClient` options:

```typescript
  return createClient(env.supabaseUrl as string, env.supabaseAnonKey as string, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      flowType: 'pkce',
      // RN has no URL bar; OAuth redirects aren't parsed from the launch URL.
      detectSessionInUrl: false,
    },
  });
```

(`storage: AsyncStorage` is replaced in Task 2 — leave as-is here.)

- [x] **Step 2: Replace `signInWithGoogle` body in `src/auth/actions.ts`**

Replace the whole function (lines 74–113) with:

```typescript
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const redirectTo = makeRedirectUri({ scheme: 'plately', path: 'auth-callback' });
    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) return { error: error?.message ?? 'Google sign-in failed.' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return { error: null }; // user cancelled

    const url = result.url;
    // Only trust a callback that matches our registered redirect.
    if (!url.startsWith(redirectTo)) return { error: 'OAuth callback URL mismatch.' };

    // PKCE flow only: the redirect must carry an authorization code. Tokens in
    // the URL fragment (implicit flow) are never accepted.
    const queryString = url.split('?')[1]?.split('#')[0] ?? '';
    const code = new URLSearchParams(queryString).get('code');
    if (!code) return { error: 'Google sign-in did not return an authorization code.' };

    const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
    return { error: codeError ? codeError.message : null };
  } catch (err) {
    return { error: message(err, 'Google sign-in failed.') };
  }
}
```

Note: the scheme stays `plately` — it is a registered identifier, not user-visible copy.

- [x] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass (existing suites are pure-utils and unaffected).

- [x] **Step 4: Commit**

```bash
git add src/auth/client.ts src/auth/actions.ts
git commit -m "security: force PKCE OAuth flow, drop implicit-token fallback"
```

### Task 2: Encrypt persisted auth session (LargeSecureStore)

Supabase session JSON exceeds SecureStore's 2048-byte value limit, so use the
standard LargeSecureStore pattern: AES-CTR-encrypt the payload into AsyncStorage,
keep the per-key AES key in the iOS Keychain via SecureStore. Existing plain
AsyncStorage sessions are silently invalid afterward (users re-login) — fine
pre-launch.

**Files:**
- Create: `src/auth/secureStorage.ts`
- Create: `src/auth/__tests__/secureStorage.test.ts`
- Modify: `src/auth/client.ts`
- Modify: `package.json` (deps)

- [x] **Step 1: Install dependencies**

Run: `npx expo install expo-secure-store && npm install aes-js && npm install -D @types/aes-js`
Expected: expo-secure-store at the SDK-52-pinned version; aes-js ^3.1.2.

- [x] **Step 2: Write the failing test**

Create `src/auth/__tests__/secureStorage.test.ts`:

```typescript
const secureStore = new Map<string, string>();
const asyncStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => secureStore.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => void secureStore.set(k, v)),
  deleteItemAsync: jest.fn(async (k: string) => void secureStore.delete(k)),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k: string) => asyncStore.get(k) ?? null),
  setItem: jest.fn(async (k: string, v: string) => void asyncStore.set(k, v)),
  removeItem: jest.fn(async (k: string) => void asyncStore.delete(k)),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytes: jest.fn((n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 7 + 3) % 256)),
}));

import { LargeSecureStore } from '../secureStorage';

describe('LargeSecureStore', () => {
  beforeEach(() => {
    secureStore.clear();
    asyncStore.clear();
  });

  it('round-trips a value', async () => {
    const store = new LargeSecureStore();
    const session = JSON.stringify({ access_token: 'a'.repeat(1200), refresh_token: 'r'.repeat(64) });
    await store.setItem('sb-test-auth-token', session);
    await expect(store.getItem('sb-test-auth-token')).resolves.toBe(session);
  });

  it('does not store plaintext in AsyncStorage', async () => {
    const store = new LargeSecureStore();
    await store.setItem('k', 'super-secret-session');
    expect(asyncStore.get('k')).toBeDefined();
    expect(asyncStore.get('k')).not.toContain('super-secret-session');
  });

  it('returns null for a missing key', async () => {
    const store = new LargeSecureStore();
    await expect(store.getItem('missing')).resolves.toBeNull();
  });

  it('returns null when the encryption key is gone', async () => {
    const store = new LargeSecureStore();
    await store.setItem('k', 'value');
    secureStore.clear();
    await expect(store.getItem('k')).resolves.toBeNull();
  });

  it('removeItem clears both stores', async () => {
    const store = new LargeSecureStore();
    await store.setItem('k', 'value');
    await store.removeItem('k');
    expect(asyncStore.has('k')).toBe(false);
    expect(secureStore.size).toBe(0);
  });
});
```

- [x] **Step 3: Run test to verify it fails**

Run: `npx jest src/auth/__tests__/secureStorage.test.ts`
Expected: FAIL — `Cannot find module '../secureStorage'`

- [x] **Step 4: Implement `src/auth/secureStorage.ts`**

```typescript
// =============================================================================
// auth/secureStorage — encrypted storage adapter for the Supabase session
// =============================================================================
// SecureStore (Keychain) caps values at 2048 bytes; a Supabase session is
// larger. So: AES-256-CTR encrypt the value into AsyncStorage and keep the
// random per-key AES key in SecureStore. Losing the Keychain entry just means
// the session fails to decrypt and the user signs in again.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import aesjs from 'aes-js';

// SecureStore keys must be alphanumeric plus "._-"; Supabase keys qualify
// (e.g. "sb-<ref>-auth-token") but sanitize defensively.
function keychainKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

export class LargeSecureStore {
  async getItem(key: string): Promise<string | null> {
    const encryptedHex = await AsyncStorage.getItem(key);
    if (!encryptedHex) return null;
    const keyHex = await SecureStore.getItemAsync(keychainKey(key));
    if (!keyHex) return null;
    try {
      const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(keyHex), new aesjs.Counter(1));
      return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(encryptedHex)));
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encryptionKey = Crypto.getRandomBytes(32);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(keychainKey(key), aesjs.utils.hex.fromBytes(encryptionKey));
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encrypted));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(keychainKey(key));
  }
}
```

- [x] **Step 5: Run test to verify it passes**

Run: `npx jest src/auth/__tests__/secureStorage.test.ts`
Expected: PASS (5 tests)

- [x] **Step 6: Wire into the client**

In `src/auth/client.ts`: remove the AsyncStorage import, add
`import { LargeSecureStore } from './secureStorage';`, and set
`storage: new LargeSecureStore(),` in the auth options (replacing
`storage: AsyncStorage,`). Update the file-header comment ("Sessions persist
encrypted at rest — AES key in the Keychain, ciphertext in AsyncStorage").

- [x] **Step 7: Verify full suite**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [x] **Step 8: Commit**

```bash
git add src/auth/secureStorage.ts src/auth/__tests__/secureStorage.test.ts src/auth/client.ts package.json package-lock.json
git commit -m "security: encrypt persisted auth session (Keychain-backed AES)"
```

### Task 3: Dependency hygiene — drop eas-cli dev-dep

All 11 high npm-audit findings chain through the `eas-cli` devDependency. It is a
CLI, not a library import; nothing in `package.json` scripts references it.
Developers use `npx eas-cli@latest` or a global install.

**Files:**
- Modify: `package.json` (remove `eas-cli` from devDependencies)
- Modify: `README.md` (build instructions mention `npx eas-cli`)

- [x] **Step 1: Remove the dependency**

Run: `npm uninstall eas-cli`

- [x] **Step 2: Re-audit**

Run: `npm audit --audit-level=high`
Expected: 0 high/critical. If any remain, run `npm audit fix` (never `--force` —
it downgrades across majors). Anything still remaining is Expo-SDK-pinned:
record it in the commit body, do not chase.

- [x] **Step 3: Update README build section**

Wherever README references `eas build`, prefix with `npx eas-cli@latest` or note
`npm i -g eas-cli`. (Full EvoEat wording pass happens in Task 8 — only touch the
command here.)

- [x] **Step 4: Verify**

Run: `npm run typecheck && npm test`
Expected: pass.

- [x] **Step 5: Commit**

```bash
git add package.json package-lock.json README.md
git commit -m "security: remove eas-cli dev-dep (source of all high npm-audit findings)"
```

### Task 4: Untrack the assets zip and .claude/memory

21 MB store-assets zip and session memory notes are tracked. Neither belongs in
the repo. Files stay on disk (`git rm --cached` only) — the zip is still needed
in Phase 2.

**Files:**
- Modify: `.gitignore`

- [x] **Step 1: Untrack**

```bash
git rm --cached "Plately app store assets.zip"
git rm -r --cached .claude/memory
```

- [x] **Step 2: Ignore**

Append to `.gitignore`:

```
# Store assets (uploaded to App Store Connect, not shipped in the bundle)
*.zip

# Claude session state
.claude/memory/
```

- [x] **Step 3: Verify**

Run: `git status --short`
Expected: deletions staged for the zip + memory files, `.gitignore` modified,
files still present on disk (`ls "Plately app store assets.zip"` succeeds).

- [x] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: untrack store-assets zip and local session notes"
```

---

## Phase 2 — Rebrand (name-only)

### Task 5: Swap app icons from the assets zip; remove stale generator

`scripts/gen-assets.mjs` draws the old programmatic mark and would clobber the
new icons if ever re-run — delete it. Splash stays unchanged per spec (generator
cannot produce the mascot).

**Files:**
- Modify: `assets/icon.png`, `assets/adaptive-icon.png` (binary replace)
- Delete: `scripts/gen-assets.mjs`

- [x] **Step 1: Extract and copy the icon**

```bash
unzip -o "Plately app store assets.zip" "AppStore/icon/icon-1a-classic-1024.png" -d /tmp/evoeat-icon
cp "/tmp/evoeat-icon/AppStore/icon/icon-1a-classic-1024.png" assets/icon.png
cp "/tmp/evoeat-icon/AppStore/icon/icon-1a-classic-1024.png" assets/adaptive-icon.png
```

- [x] **Step 2: Delete the generator**

```bash
git rm scripts/gen-assets.mjs
```

- [x] **Step 3: Verify**

Run: `file assets/icon.png` → `PNG image data, 1024 x 1024`. Start the app
(`npx expo start`) if a simulator is handy; icon change is visible after next
native build, not required now.

- [x] **Step 4: Commit**

```bash
git add assets/icon.png assets/adaptive-icon.png
git commit -m "brand: EvoEat app icon (classic mascot on emerald)"
```

### Task 6: app.json — display name + permission strings

**Files:**
- Modify: `app.json`

- [x] **Step 1: Edit**

- `expo.name`: `"Plately"` → `"EvoEat"`
- `expo.ios.infoPlist.NSCameraUsageDescription`: `"EvoEat uses the camera so you can photograph your meals and estimate their nutrition on your device."`
- `expo.ios.infoPlist.NSPhotoLibraryUsageDescription`: `"EvoEat lets you pick a meal photo from your library to estimate its nutrition."`
- `expo.ios.infoPlist.NSPhotoLibraryAddUsageDescription`: `"EvoEat can save a meal photo you capture to your photo library."`
- plugins `expo-camera.cameraPermission` and `expo-image-picker.photosPermission`: same rewording, "Plately" → "EvoEat".
- **Do NOT touch:** `slug`, `scheme`, `ios.bundleIdentifier`, `android.package`, `extra.eas.projectId`, `owner`.

- [x] **Step 2: Verify**

Run: `npx expo config --type public | grep -i -A1 '"name"' | head -4`
Expected: name `EvoEat`, slug `plately`.

- [x] **Step 3: Commit**

```bash
git add app.json
git commit -m "brand: rename display name and permission copy to EvoEat"
```

### Task 7: src/ user-visible string sweep

**Files (all Modify)** — every file that greps for `Plately`:
`src/navigation/types.ts`, `src/navigation/RootNavigator.tsx`, `src/utils/export.ts`, `src/state/useSettings.ts`, `src/state/usePlus.ts`, `src/screens/GoalPhasesScreen.tsx`, `src/screens/CameraScreen.tsx`, `src/screens/AuthScreen.tsx`, `src/screens/FastingScreen.tsx`, `src/screens/CoachScreen.tsx`, `src/screens/PrivacyPolicyScreen.tsx`, `src/screens/OnboardingScreen.tsx`, `src/screens/AppearanceScreen.tsx`, `src/screens/PlatelyPlusScreen.tsx`, `src/screens/HomeScreen.tsx`, `src/screens/SettingsScreen.tsx`, `src/screens/OnboardingFlowScreen.tsx`, `src/components/PlusLock.tsx`, `src/iap/purchases.ts`, `src/screens/MealPlannerScreen.tsx`, `src/screens/TermsScreen.tsx`, `src/data/openFoodFacts.ts`

- [x] **Step 1: Replace display strings only**

Rules, applied per occurrence:
- String literals rendered to users, comments, and doc headers: `Plately` → `EvoEat`; `Plately Plus` / `Plately+` → `EvoEat+`.
- HTTP `User-Agent` in `src/data/openFoodFacts.ts`: rename app part to `EvoEat` (keep version/contact shape).
- CSV/export titles in `src/utils/export.ts`: rename.
- **Do NOT rename:** route name `PlatelyPlus` (navigation identifier), file/component names (`PlatelyPlusScreen`, `PlusLock`), zustand persist keys in `useSettings.ts` (breaks existing installs), `PLUS_ENTITLEMENT` value in `src/iap/purchases.ts` (RevenueCat dashboard id), `plately` scheme in `src/auth/actions.ts`.

- [x] **Step 2: Exit-criterion grep**

Run: `grep -rIn "Plately" src/ App.tsx | grep -vE "PlatelyPlus(Screen)?|plately(://|')|persist|entitlement"`
Expected: zero lines. Then run `grep -rIn "Plately" src/ App.tsx` and manually
confirm every remaining hit is an identifier (route, filename, scheme, storage
key, entitlement).

- [x] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Expected: pass. Smoke-test in simulator: Settings, Plus screen, Auth screen show "EvoEat".

- [x] **Step 4: Commit**

```bash
git add src/ App.tsx
git commit -m "brand: EvoEat user-visible copy across screens and exports"
```

### Task 8: Docs rebrand

**Files:**
- Modify: `README.md`, `PRODUCT.md`, `docs/PRIVACY_POLICY.md`

- [x] **Step 1: Update titles and app-name references** ("Plately" → "EvoEat",
"Plately+" → "EvoEat+"). Repo/package name `plately` and bundle id references
stay. Note "(formerly Plately)" once in README intro.

- [x] **Step 2: Commit**

```bash
git add README.md PRODUCT.md docs/PRIVACY_POLICY.md
git commit -m "docs: rebrand copy to EvoEat"
```

---

## Phase 3 — Pre-commit hook

### Task 9: Checked-in hook: typecheck + lint + secret scan

**Files:**
- Create: `.githooks/pre-commit`
- Modify: `package.json` (add `prepare` script)
- Modify: `README.md` (one setup line)

- [x] **Step 1: Create `.githooks/pre-commit`**

```sh
#!/bin/sh
# Pre-commit gate: typecheck, lint, and staged-diff secret scan.
set -e

echo "pre-commit: typecheck"
npm run --silent typecheck

echo "pre-commit: lint"
npm run --silent lint

echo "pre-commit: secret scan"
# Added lines only. Patterns: Supabase secret keys, JWTs, Stripe-style keys,
# RevenueCat prod keys.
if git diff --cached -U0 | grep -nE '^\+.*(sb_secret_[A-Za-z0-9_-]{8,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sk_(live|test)_[A-Za-z0-9]{16,}|appl_[A-Za-z0-9]{16,})'; then
  echo "" >&2
  echo "Blocked: staged changes look like they contain a secret." >&2
  echo "Remove it (use .env) or, if a false positive, commit with --no-verify." >&2
  exit 1
fi
```

Then: `chmod +x .githooks/pre-commit`

- [x] **Step 2: Wire via npm prepare**

In `package.json` scripts add:

```json
"prepare": "git config core.hooksPath .githooks || true"
```

Run `npm run prepare` once now. Add to README dev-setup: "Hooks activate
automatically on `npm install` (`core.hooksPath .githooks`)."

- [x] **Step 3: Test — planted secret must be rejected**

```bash
# (fake key assembled at runtime so this doc itself passes the secret scan)
printf 'const k = "%s_%s";\n' "sk_live" "ABCDEFGHIJKLMNOP1234" > /tmp/leak.ts && cp /tmp/leak.ts src/leak-test.ts
git add src/leak-test.ts
git commit -m "should fail" && echo "BUG: hook did not block" || echo "OK: blocked"
git reset HEAD src/leak-test.ts && rm src/leak-test.ts
```

Expected: `OK: blocked` (typecheck may fail first on the stray file — either
rejection path is a pass; if typecheck blocked it, re-test the regex path with a
`.md` file containing the fake key).

- [x] **Step 4: Test — clean commit passes**

Commit the real changes:

```bash
git add .githooks/pre-commit package.json README.md
git commit -m "chore: pre-commit hook (typecheck, lint, secret scan)"
```

Expected: hook runs, commit lands.

---

## Phase 4 — CI/CD

### Task 10: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [x] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # full history for gitleaks

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Tests
        run: npm test

      - name: Dependency audit
        run: npm audit --audit-level=high

      - name: Secret scan (full history)
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

(gitleaks-action is free for personal repos; no license key needed.)

- [x] **Step 2: Validate syntax locally**

Run: `npx --yes yaml-lint .github/workflows/ci.yml` (or `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"`)
Expected: parses clean.

- [x] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: typecheck, lint, tests, npm audit, gitleaks on PRs and main"
```

### Task 11: EAS build workflow

**Files:**
- Create: `.github/workflows/eas-build.yml`

- [x] **Step 1: Create `.github/workflows/eas-build.yml`**

```yaml
name: EAS Build (iOS)

on:
  workflow_dispatch:
    inputs:
      submit:
        description: "Auto-submit to TestFlight (requires verified Apple Developer account)"
        type: boolean
        default: false
  push:
    tags: ["v*"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - run: npm ci

      - name: Build iOS (production profile)
        run: >
          eas build --platform ios --profile production --non-interactive --no-wait
          ${{ inputs.submit == true && '--auto-submit' || '' }}
```

Tag pushes never auto-submit (`inputs.submit` is empty there); TestFlight submit
is the manual-dispatch checkbox only — flip it once the Apple Developer license
is verified.

- [x] **Step 2: Validate syntax**

Same YAML parse check as Task 10.

- [x] **Step 3: Commit**

```bash
git add .github/workflows/eas-build.yml
git commit -m "ci: EAS iOS build on tags and manual dispatch, gated TestFlight submit"
```

### Task 12: Push branch, verify CI, deliver user-action list

- [x] **Step 1: Push and watch**

```bash
git push origin main
gh run watch --exit-status
```

Expected: CI workflow green. (eas-build only fires on tags/dispatch — not
validated here; it consumes build quota.)

- [x] **Step 2: Deliver the user-action list** (these cannot be done from the repo):

1. **GitHub → Settings → Secrets → Actions:** add `EXPO_TOKEN` (create at expo.dev → Account settings → Access tokens).
2. **EAS environment variables:** `.env` is gitignored, so EAS cloud builds need `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REVENUECAT_IOS_KEY` set as EAS project env vars (`npx eas-cli@latest env:create` or expo.dev dashboard) for the production profile.
3. **RevenueCat:** current `.env` key is `test_…` — set the production `appl_…` key in EAS env before the release build.
4. **Supabase dashboard → Auth:** confirm redirect allowlist contains exactly `plately://auth-callback`; enable leaked-password protection; confirm the key rotation from commit 648beaf was completed server-side.
5. **App Store Connect:** display name "EvoEat"; upload `AppStore/icon/icon-1a-classic-1024.png` and the `AppStore/6.9-inch/light/` screenshot set from the zip.

---

## Self-review notes

- Spec coverage: Phase 1 items 1–6 → Tasks 1–4 (+ audit verdicts header for the
  no-action items); Phase 2 → Tasks 5–8; Phase 3 → Task 9; Phase 4 → Tasks 10–12. ✓
- Splash intentionally unchanged (spec: icon-only swap when generator can't
  produce the mascot). Generator deleted instead per footgun finding. ✓
- Type consistency: `LargeSecureStore` class name/methods match between test,
  implementation, and client wiring. ✓
