// =============================================================================
// MacroBars — Animated protein / carbs / fat progress bars
// =============================================================================
// Three horizontal progress bars stacked vertically, one per macro. Bars
// animate width on mount and on value change. Each bar uses the macro's
// dedicated color from `theme.macroColors`. Designed to sit inside a card
// (no own background); the consumer provides container styling.

import { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { macroColors, radius, spacing, font } from '../theme';
import { useTheme } from '../theme/ThemeContext';
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
  trackColor,
}: {
  pct: number;
  color: string;
  delay: number;
  trackColor: string;
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
      style={[styles.track, { backgroundColor: trackColor }]}
      onLayout={(e) => {
        containerWidth.current = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

export function MacroBars({ protein, carbs, fat, goals }: MacroBarsProps) {
  const p = useTheme();
  const localStyles = useMemo(() => makeStyles(p), [p]);
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
              <Text style={localStyles.label}>{row.label}</Text>
              <Text style={localStyles.value}>
                {fmt(value)}
                <Text style={localStyles.goal}> / {fmt(goal)} g</Text>
              </Text>
            </View>
            <AnimatedBar pct={pct} color={row.color} delay={i * 80} trackColor={p.surfaceAlt} />
          </View>
        );
      })}
    </View>
  );
}

// Static styles that don't depend on the palette
const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { gap: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  track: {
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    label: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiMedium },
    value: { color: p.text, fontSize: font.size.sm, fontFamily: font.family.monoSemibold },
    goal: { color: p.textFaint, fontFamily: font.family.mono },
  });
}
