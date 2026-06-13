// Design tokens.

export const palette = {
  // Accent — electric indigo. Used sparingly: focus/active state + primary CTA.
  accent: '#7370FA',
  accentDark: '#5E58D8',
  accentSoft: '#2B284F',

  // Deprecated aliases → accent. Existing `palette.green` refs now render
  // indigo; migrate them to `palette.accent` when touching a file.
  green: '#7370FA',
  greenDark: '#5E58D8',

  // Functional signal colors (meaning, not decoration)
  teal: '#4FBEC4',
  amber: '#F5AE39',
  red: '#EA3C3F',
  blue: '#4D97DE',
  water: '#49ABD6',

  // Surfaces — warm near-black, faintly indigo-tinted
  bg: '#0B0B0E',
  surface: '#15151B',
  surfaceAlt: '#212128',
  border: '#2F2F37',

  // Text — near-white with a faint cool tint
  text: '#F5F5F8',
  textMuted: '#9797A5',
  textFaint: '#575762',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const macroColors = {
  protein: '#EF6661',
  carbs: '#EEBC4A',
  fat: '#00B4BC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999,
} as const;

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
  // Custom font families. RN ignores `fontWeight` once `fontFamily` is set, so
  // each weight is its own family — pick the family, not the weight.
  // `ui` = Space Grotesk (text/headings), `mono` = JetBrains Mono (all numbers).
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

export type Palette = typeof palette;
