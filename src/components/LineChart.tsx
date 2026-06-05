import { useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';

import { palette, font, spacing } from '../theme';

export interface LinePoint {
    label: string;
    value: number;
}

interface LineChartProps {
    data: LinePoint[];
    unit?: string;
    height?: number;
    color?: string;
}

export function LineChart({ data, unit, height = 180, color = palette.green }: LineChartProps) {
    const [width, setWidth] = useState(0);
    const onLayout = (e: LayoutChangeEvent) =>
        setWidth(e.nativeEvent.layout.width);

    const values = data.map((d) => d.value);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const pad = (max - min) * 0.1 || 1; //no baseline at 0, padding for better curve on graph yurme and no div by 0
    const lo = min - pad;
    const hi = max + pad;

    const chartH = height - 28; //labeling space
    const n = data.length;
    const toX = (i: number) => (n <= 1 ? width / 2 : (i / (n-1)) * width);
    const toY = (v: number) => chartH - ((v - lo) / (hi - lo)) * chartH;

    const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');

    return (
        <View onLayout={onLayout}>
        <View style={{ height }}>
          {width > 0 && n > 0 && (
            <Svg width={width} height={height}>
              {n > 1 && <Polyline points={points} fill="none" 
  stroke={color} strokeWidth={2} />}
              {data.map((d, i) => (
                <Circle key={i} cx={toX(i)} cy={toY(d.value)} r={3} 
  fill={color} />
              ))}
            </Svg>
          )}
        </View>
        <View style={styles.labels}>
          <Text style={styles.label}>{data[0]?.label ?? ''}</Text>
          <Text style={styles.label}>{data[n - 1]?.label ?? ''}</Text>
        </View>
        <Text style={styles.range}>
          Range {Math.round(lo)}–{Math.round(hi)}
          {unit ? ` ${unit}` : ''}
        </Text>
      </View>
    );
}

const styles = StyleSheet.create({
    labels: { flexDirection: 'row', justifyContent: 'space-between',
  marginTop: spacing.xs },
    label: { color: palette.textFaint, fontSize: font.size.xs },
    range: { color: palette.textFaint, fontSize: font.size.xs,
  textAlign: 'center', marginTop: spacing.sm },
});
