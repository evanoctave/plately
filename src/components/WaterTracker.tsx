import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { palette, radius, spacing, font } from '../theme';
import { clamp01 } from '../utils/nutrition';
import { mlToDisplay, useSettings } from '../state/useSettings';

interface WaterTrackerProps {
  /** Water consumed today, in mL (sum of all entries' water content). */
  consumedMl: number;
  goalMl: number;
  onAdd: (ml: number) => void;
}

const QUICK_ADDS_ML = [250, 500];

export function WaterTracker({ consumedMl, goalMl, onAdd }: WaterTrackerProps) {
  const unit = useSettings((s) => s.waterUnit);
  const pct = clamp01(goalMl > 0 ? consumedMl / goalMl : 0);

  const add = (ml: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd(ml);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="water" size={18} color={palette.water} />
          <Text style={styles.title}>Water</Text>
        </View>
        <Text style={styles.amount}>
          {mlToDisplay(consumedMl, unit)} / {mlToDisplay(goalMl, unit)} {unit}
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>

      <View style={styles.buttons}>
        {QUICK_ADDS_ML.map((ml) => (
          <Pressable
            key={ml}
            onPress={() => add(ml)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${mlToDisplay(ml, unit)} ${unit} of water`}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Ionicons name="add" size={16} color={palette.water} />
            <Text style={styles.chipText}>
              {mlToDisplay(ml, unit)} {unit}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { color: palette.text, fontSize: font.size.lg, fontFamily: font.family.uiSemibold },
  amount: { color: palette.textMuted, fontSize: font.size.sm, fontFamily: font.family.mono },
  track: { height: 12, borderRadius: radius.pill, backgroundColor: palette.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: palette.water },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
  },
  chipPressed: { opacity: 0.7 },
  chipText: { color: palette.water, fontSize: font.size.sm, fontFamily: font.family.monoSemibold },
});
