// =============================================================================
// utils/format — Number formatters for display
// =============================================================================
// Two helpers used throughout the UI to keep numeric display consistent:
//   fmt   — at most one decimal, no trailing ".0" (used for macros like "12.5g")
//   fmtInt — comma-grouped integers (used for calories, water mL, etc.)

/** Formats a number with at most one decimal and no trailing ".0". */
export function fmt(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** "1,234" style grouping for large calorie/water totals. */
export function fmtInt(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function gram(value: number): string {
  return `${fmt(value)} g`;
}
