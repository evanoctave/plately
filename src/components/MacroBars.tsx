import { View, Text, StyleSheet } from 'react-native';

import { macroColors, palette, radius, spacing, font } from '../theme';
import { clamp01 } from '../utils/nutrition';
import { fmt } from '../utils/format';
import type { Goals } from '../data/nutrients';

interface MacroBarsProps {
  protein: number;
  carbs: number;
  fat: number;
  goals: Goals;
}

const ROWS = [
  { key: 'protein', label: 'Protein', color: macroColors.protein },
  { key: 'carbs', label: 'Carbs', color: macroColors.carbs },
  { key: 'fat', label: 'Fat', color: macroColors.fat },
] as const;

export function MacroBars({ protein, carbs, fat, goals }: MacroBarsProps) {
  const values = { protein, carbs, fat };
  return (
    <View style={styles.container}>
      {ROWS.map((row) => {
        const value = values[row.key];
        const goal = goals[row.key];
        const pct = clamp01(goal > 0 ? value / goal : 0);
        return (
          <View key={row.key} style={styles.row}>
            <View style={styles.headerRow}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>
                {fmt(value)} / {fmt(goal)} g
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: row.color }]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { gap: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: palette.text, fontSize: font.size.md, fontWeight: font.weight.medium },
  value: { color: palette.textMuted, fontSize: font.size.sm },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
