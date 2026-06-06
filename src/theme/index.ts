// Design tokens.

export const palette = {
  // Brand — more vivid, saturated vs iOS system defaults
  green: '#1EE07A',
  greenDark: '#0DB85C',
  teal: '#26C6D8',
  amber: '#FFAA00',
  red: '#FF4040',
  blue: '#147EFF',
  water: '#29B6E8',

  // Surfaces — deep cool-dark with blue-slate character
  bg: '#0A0C13',
  surface: '#111420',
  surfaceAlt: '#181B2A',
  border: '#222640',

  // Text — slightly blue-tinted white for crispness
  text: '#EBF0FF',
  textMuted: '#7A86A0',
  textFaint: '#485068',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const macroColors = {
  protein: '#FF5A6A',
  carbs: '#FFB93A',
  fat: '#5B8FFF',
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
} as const;

export type Palette = typeof palette;
