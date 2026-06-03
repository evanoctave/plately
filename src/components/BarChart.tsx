import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

import { palette, font, spacing } from '../theme';
import { clamp01 } from '../utils/nutrition';

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  data: BarDatum[];
  goal?: number; // optional reference line
  height?: number;
  color?: string;
  unit?: string;
}

/**
 * SVG bar chart for ~14 bars of daily totals with an optional goal line.
 */
export function BarChart({ data, goal, height = 160, color = palette.green, unit }: BarChartProps) {
  const max = Math.max(goal ?? 0, ...data.map((d) => d.value), 1);
  const barAreaHeight = height - 24; // leave room for labels
  const barWidthPct = 100 / Math.max(data.length, 1);

  return (
    <View>
      <View style={{ height }}>
        <Svg width="100%" height={height}>
          {goal !== undefined && goal > 0 && (
            <Line
              x1="0%"
              x2="100%"
              y1={barAreaHeight - clamp01(goal / max) * barAreaHeight}
              y2={barAreaHeight - clamp01(goal / max) * barAreaHeight}
              stroke={palette.textFaint}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          {data.map((d, i) => {
            const h = clamp01(d.value / max) * barAreaHeight;
            const x = `${i * barWidthPct + barWidthPct * 0.2}%`;
            const w = `${barWidthPct * 0.6}%`;
            return (
              <Rect
                key={i}
                x={x}
                y={barAreaHeight - h}
                width={w}
                height={Math.max(h, d.value > 0 ? 2 : 0)}
                rx={3}
                fill={d.highlight ? palette.green : d.value > 0 ? color : palette.surfaceAlt}
                opacity={d.highlight ? 1 : 0.85}
              />
            );
          })}
        </Svg>
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={i} style={[styles.label, d.highlight && styles.labelHighlight]} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
      {goal !== undefined && goal > 0 && (
        <Text style={styles.goalNote}>
          Dashed line = goal ({Math.round(goal)}
          {unit ? ` ${unit}` : ''})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', marginTop: spacing.xs },
  label: { flex: 1, textAlign: 'center', color: palette.textFaint, fontSize: font.size.xs },
  labelHighlight: { color: palette.green, fontWeight: font.weight.bold },
  goalNote: { color: palette.textFaint, fontSize: font.size.xs, marginTop: spacing.sm, textAlign: 'center' },
});
