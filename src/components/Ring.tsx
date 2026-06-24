// =============================================================================
// Ring — Animated progress ring (with two variants)
// =============================================================================
// Two exports:
//
//   Ring    — Small inline ring used as a visual marker inside macro / calorie
//             cards. Optionally renders an Ionicons glyph in the center.
//             Default size 56, stroke 6. Animated stroke-dashoffset fills the
//             arc when `progress` changes.
//
//   BigRing — Larger ring with centered value / goal / caption text (used by
//             the DayDetail screen and any leftover "big calorie hero" call
//             sites). Switches to amber when over-goal.
//
// Both use react-native-svg + reanimated. Progress is clamped to [0, 1].

import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { font } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { clamp01 } from '../utils/nutrition';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  // When set, renders an icon in the center instead of text. Use for inline
  // macro/calorie cards where the ring is a visual marker, not the focal data.
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function Ring({
  progress,
  size = 56,
  strokeWidth = 6,
  color,
  trackColor,
  icon,
  iconColor,
}: RingProps) {
  const p = useTheme();
  const resolvedColor = color ?? p.accent;
  const resolvedTrackColor = trackColor ?? p.surfaceAlt;

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const targetOffset = circumference * (1 - clamp01(progress));
  const animatedOffset = useSharedValue(circumference);

  useEffect(() => {
    animatedOffset.value = withTiming(targetOffset, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetOffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {icon && (
        <View style={styles.center} pointerEvents="none">
          <Ionicons name={icon} size={Math.round(size * 0.42)} color={iconColor ?? resolvedColor} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Old large ring with center text — used by other screens that may still
// render the big calorie ring (history detail, etc.). The new Ring above is
// the inline mini variant.
interface BigRingProps {
  progress: number;
  value: number;
  goal: number;
  label: string;
  unit?: string;
  size?: number;
  color?: string;
}

export function BigRing({
  progress,
  value,
  goal,
  label,
  unit = '',
  size = 172,
  color,
}: BigRingProps) {
  const p = useTheme();
  const bigStyles = useMemo(() => makeBigStyles(p), [p]);
  const resolvedColor = color ?? p.accent;

  const strokeWidth = 13;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const targetOffset = circumference * (1 - clamp01(progress));
  const over = value > goal;
  const strokeColor = over ? p.amber : resolvedColor;
  const animatedOffset = useSharedValue(circumference);

  useEffect(() => {
    animatedOffset.value = withTiming(targetOffset, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetOffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={p.surfaceAlt} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={bigStyles.center} pointerEvents="none">
        <Text style={bigStyles.value}>{Math.round(value)}</Text>
        <Text style={bigStyles.label}>
          of {Math.round(goal)}
          {unit ? ` ${unit}` : ''}
        </Text>
        <Text style={bigStyles.caption}>{label}</Text>
      </View>
    </View>
  );
}

function makeBigStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    value: { color: p.text, fontSize: 32, fontFamily: font.family.monoBold, letterSpacing: -1 },
    label: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.ui, marginTop: 2 },
    caption: {
      color: p.textFaint,
      fontSize: font.size.xs,
      fontFamily: font.family.uiMedium,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });
}
