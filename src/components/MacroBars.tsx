import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

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

function AnimatedBar({
  pct,
  color,
  delay,
}: {
  pct: number;
  color: string;
  delay: number;
}) {
  const width = useSharedValue(0);
  const containerWidth = useRef(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [pct, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as `${number}%`,
  }));

  return (
    <View
      style={styles.track}
      onLayout={(e) => {
        containerWidth.current = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

export function MacroBars({ protein, carbs, fat, goals }: MacroBarsProps) {
  const values = { protein, carbs, fat };
  return (
    <View style={styles.container}>
      {ROWS.map((row, i) => {
        const value = values[row.key];
        const goal = goals[row.key];
        const pct = clamp01(goal > 0 ? value / goal : 0);
        return (
          <View key={row.key} style={styles.row}>
            <View style={styles.headerRow}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>
                {fmt(value)}
                <Text style={styles.goal}> / {fmt(goal)} g</Text>
              </Text>
            </View>
            <AnimatedBar pct={pct} color={row.color} delay={i * 80} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  row: { gap: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { color: palette.textMuted, fontSize: font.size.sm, fontWeight: font.weight.medium },
  value: { color: palette.text, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  goal: { color: palette.textFaint, fontWeight: font.weight.regular },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
