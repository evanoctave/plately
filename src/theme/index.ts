/**
 * Central design tokens. A single source of truth keeps every screen visually
 * consistent and makes light/dark theming trivial.
 */

export const palette = {
  // Brand
  green: '#34C759',
  greenDark: '#248A3D',
  teal: '#30B0C7',
  amber: '#FF9F0A',
  red: '#FF453A',
  blue: '#0A84FF',
  water: '#32ADE6',

  // Dark surfaces (default theme)
  bg: '#0E1116',
  surface: '#171B22',
  surfaceAlt: '#1F242D',
  border: '#2A2F3A',

  // Text
  text: '#F2F4F8',
  textMuted: '#9AA3B2',
  textFaint: '#646C7A',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const macroColors = {
  protein: '#FF6B6B',
  carbs: '#FFB84D',
  fat: '#4D9DFF',
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
