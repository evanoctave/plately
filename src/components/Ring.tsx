import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { palette, font } from '../theme';
import { clamp01 } from '../utils/nutrition';
import { fmtInt } from '../utils/format';

interface RingProps {
  /** 0..1+ progress (values >1 are clamped for the arc but shown as overage). */
  progress: number;
  value: number;
  goal: number;
  label: string;
  unit?: string;
  size?: number;
  color?: string;
}

/** A calorie/goal progress ring rendered with SVG (no native deps beyond svg). */
export function Ring({
  progress,
  value,
  goal,
  label,
  unit = '',
  size = 180,
  color = palette.green,
}: RingProps) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamp01(progress);
  const over = value > goal;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={over ? palette.amber : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
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
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  value: { color: palette.text, fontSize: font.size.xxl, fontWeight: font.weight.bold },
  label: { color: palette.textMuted, fontSize: font.size.sm, marginTop: 2 },
  caption: { color: palette.textFaint, fontSize: font.size.xs, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
});
