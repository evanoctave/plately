// =============================================================================
// THEME — Design tokens
// =============================================================================
// Central source of truth for colors, spacing, typography, and elevation.
// Every component imports from here instead of using raw hex values or magic
// numbers, so a single edit here re-skins the whole app.
//
// Conventions:
//   - `palette` holds named colors (semantic + functional).
//   - `spacing` / `radius` / `font` are scales — pick a step, not a raw number.
//   - `shadow.card` is the only resting elevation in the app.
//
// When templating this for a new app: change `palette.accent` first, then
// the surface/text values. The rest cascades.

/**
 * App-wide color values.
 *
 * Semantic roles (use these in components):
 *   bg, surface, surfaceAlt, border    — background layers
 *   text, textMuted, textFaint         — text emphasis
 *   accent, accentDark, accentSoft     — brand color (default emerald)
 *
 * Functional colors (used to convey meaning — not decoration):
 *   teal / amber / red / blue / water  — signals (success, warning, error, info, hydration)
 *
 * Aliases (`green`, `greenDark`) exist for legacy call sites that referenced
 * the old palette; they resolve to the current accent. Migrate them when you
 * touch surrounding code.
 */
export const palette = {
  // Accent — fresh emerald. Used for active states, progress, primary CTA.
  accent: '#16A34A',
  accentDark: '#15803D',
  accentSoft: '#E7F8EE',

  // Aliases — `palette.green` etc. resolve to accent. Migrate as you touch files.
  green: '#16A34A',
  greenDark: '#15803D',

  // Functional signal colors (meaning, not decoration)
  teal: '#0EA5A8',
  amber: '#F59E0B',
  red: '#DC2626',
  blue: '#2563EB',
  water: '#0EA5E9',

  // Surfaces — warm off-white background, near-white cards
  bg: '#F8F7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F0EA',
  border: '#E6E5DD',

  // Text — near-black with a warm tint (matches the off-white bg)
  text: '#15140F',
  textMuted: '#6B6B62',
  textFaint: '#A7A69E',

  white: '#FFFFFF',
  black: '#000000',
} as const;

/** Colors assigned to each macronutrient. Used consistently across charts, rings, and macro cards. */
export const macroColors = {
  protein: '#DC2626',
  carbs: '#F59E0B',
  fat: '#0EA5A8',
} as const;

/** Spacing scale (in px). Always pick a step rather than a raw number to keep rhythm consistent. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Border radius scale. `pill` is for fully-rounded buttons / chips. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999,
} as const;

/**
 * Typography tokens.
 *
 * NOTE on `family`: React Native ignores `fontWeight` once a `fontFamily`
 * is set, so each weight ships as its own family — pick the family, not the
 * weight. `ui` = Space Grotesk (text/headings), `mono` = JetBrains Mono
 * (all numbers). Loading the fonts is handled in App.tsx via `useFonts`.
 */
export const font = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 22,
    xxl: 28,
    display: 40,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  family: {
    ui: 'SpaceGrotesk_400Regular',
    uiMedium: 'SpaceGrotesk_500Medium',
    uiSemibold: 'SpaceGrotesk_600SemiBold',
    uiBold: 'SpaceGrotesk_700Bold',
    mono: 'JetBrainsMono_500Medium',
    monoSemibold: 'JetBrainsMono_600SemiBold',
    monoBold: 'JetBrainsMono_700Bold',
  },
} as const;

/**
 * Resting elevation for white cards on the off-white background.
 * Used via `...shadow.card` spread into the card's style. iOS-tuned values;
 * `elevation: 2` provides the Android equivalent.
 */
export const shadow = {
  card: {
    shadowColor: '#0B0A07',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const darkPalette = {
  accent: '#16A34A',
  accentDark: '#15803D',
  accentSoft: '#0D2E1A',

  green: '#16A34A',
  greenDark: '#15803D',

  teal: '#0EA5A8',
  amber: '#F59E0B',
  red: '#DC2626',
  blue: '#2563EB',
  water: '#0EA5E9',

  bg: '#0F0F0D',
  surface: '#1C1C1A',
  surfaceAlt: '#252522',
  border: '#2E2E2B',

  text: '#F2F1EC',
  textMuted: '#9B9B92',
  textFaint: '#5A5A54',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type Palette = typeof palette;
