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
