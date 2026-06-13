import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { palette, font } from '../theme';
import { clamp01 } from '../utils/nutrition';
import { fmtInt } from '../utils/format';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  progress: number;
  value: number;
  goal: number;
  label: string;
  unit?: string;
  size?: number;
  color?: string;
}

export function Ring({
  progress,
  value,
  goal,
  label,
  unit = '',
  size = 200,
  color = palette.accent,
}: RingProps) {
  const strokeWidth = 16;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const targetOffset = circumference * (1 - clamp01(progress));
  const over = value > goal;

  const strokeColor = over ? palette.amber : color;
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
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={palette.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
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
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.value}>{fmtInt(value)}</Text>
        <Text style={styles.label}>
          of {fmtInt(goal)}
          {unit ? ` ${unit}` : ''}
        </Text>
        <Text style={styles.caption}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: palette.text,
    fontSize: font.size.display,
    fontFamily: font.family.monoBold,
    letterSpacing: -1,
  },
  label: {
    color: palette.textMuted,
    fontSize: font.size.sm,
    fontFamily: font.family.ui,
    marginTop: 2,
  },
  caption: {
    color: palette.textFaint,
    fontSize: font.size.xs,
    fontFamily: font.family.uiMedium,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
