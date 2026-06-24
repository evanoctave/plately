---
name: project-recent-work
description: Recent major features shipped to plately-repo — dark mode, PlatelyPlusScreen, Settings golden icon
metadata:
  type: project
---

Dark mode, PlatelyPlusScreen refactor, Settings golden icon — shipped 2026-06-24.

**Why:** User wanted full dark mode + better Plately+ UX (premium feel).

**What changed:**
- `src/theme/index.ts` — added `darkPalette` (warm dark: bg `#0F0F0D`, surface `#1C1C1A`)
- `src/theme/ThemeContext.tsx` — new file; `ThemeProvider` + `useTheme()` hook; reads `darkMode` from useSettings
- `src/state/useSettings.ts` — added `darkMode: boolean` + `setDarkMode()`, persisted
- `App.tsx` — wrapped in `ThemeProvider`, StatusBar reacts to darkMode
- `src/navigation/RootNavigator.tsx` — nav theme + headers + tab bar all react to dark mode
- All 27 screens + 11 components migrated from static `palette` import → `useTheme()` + `useMemo(() => makeStyles(p), [p])` pattern
- `AppearanceScreen` — dark mode toggle (moon icon + switch) added
- `SettingsScreen` — Plately+ cards removed; gold star button top-right navigates to PlatelyPlusScreen
- `PlatelyPlusScreen` — gold badge hero, full feature list, paywall, "Jump in" quick-access extras section (moved from Settings)

**How to apply:** When touching any screen/component, use `useTheme()` not static `palette`. Pattern: `const p = useTheme(); const styles = useMemo(() => makeStyles(p), [p]);`
