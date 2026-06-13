import { View, Text, StyleSheet } from 'react-native';

import { MICRO_META, type Nutrition } from '../data/nutrients';
import { palette, radius, spacing, font, macroColors } from '../theme';
import { clamp01 } from '../utils/nutrition';
import { fmt } from '../utils/format';

/** Renders the eight tracked micronutrients with % of FDA Daily Value. */
export function MicrosGrid({ nutrition }: { nutrition: Nutrition }) {
  return (
    <View style={styles.grid}>
      {MICRO_META.map((meta) => {
        const amount = nutrition[meta.key];
        const pct = clamp01(amount / meta.dailyValue);
        const pctLabel = Math.round((amount / meta.dailyValue) * 100);
        return (
          <View key={meta.key} style={styles.cell}>
            <Text style={styles.label}>{meta.label}</Text>
            <Text style={styles.amount}>
              {fmt(amount)} {meta.unit}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct * 100}%` }]} />
            </View>
            <Text style={styles.pct}>{pctLabel}% DV</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  label: { color: palette.textMuted, fontSize: font.size.sm },
  amount: { color: palette.text, fontSize: font.size.lg, fontFamily: font.family.monoSemibold, marginTop: 2 },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.border,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: macroColors.fat },
  pct: { color: palette.textFaint, fontSize: font.size.xs, marginTop: 4 },
});
