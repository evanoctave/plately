import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays } from 'date-fns';

import { Card, SectionTitle } from '../components/Card';
import { Button } from '../components/Button';
import { LineChart, type LinePoint } from '../components/LineChart';
import { palette, spacing, font, radius } from '../theme';
import { useSettings, kgToDisplay, displayToKg } from '../state/useSettings';
import { addWeight, getWeights, type WeightRow } from '../db/weights';
import { dayKey } from '../utils/date';
import { round } from '../utils/nutrition';

  const RANGES = [30, 90] as const;

  export function WeightScreen() {
    const accent = useSettings((s) => s.accent);
    const unit = useSettings((s) => s.weightUnit);
    const [rows, setRows] = useState<WeightRow[]>([]);
    const [range, setRange] = useState<(typeof RANGES)[number]>(30);
    const [input, setInput] = useState('');

    const load = useCallback(async () => {
      const from = dayKey(subDays(new Date(), range - 1));
      setRows(await getWeights(from));
    }, [range]);

    useFocusEffect(
      useCallback(() => {
        void load();
      }, [load]),
    );

    const save = async () => {
      const v = parseFloat(input.replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(v) || v <= 0) return;
      setInput('');
      await addWeight (dayKey(new Date()), displayToKg(v, unit));
      await load();
    };

    const points: LinePoint[] = rows.map((r) => ({
      label: format(new Date(`${r.day}T00:00:00`), 'M/d'),
      value: round(kgToDisplay(r.kg, unit)),
    }));

    const current = points.at(-1)?.value ?? null;
    const first = points[0]?.value ?? null;
    const delta = current != null && first != null ? round(current -
  first) : null;

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} 
  keyboardShouldPersistTaps="handled">
          <SectionTitle>Log today ({unit})</SectionTitle>
          <View style={styles.logRow}>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder={`Weight in ${unit}`}
              placeholderTextColor={palette.textFaint}
              value={input}
              onChangeText={setInput}
              maxLength={6}
            />
            <Button label="Save" onPress={() => void save()}
  style={styles.saveBtn} />
          </View>

          <View style={styles.rangeRow}>
            {RANGES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[styles.rangeBtn, range === r && {
  backgroundColor: accent }]}
              >
                <Text style={[styles.rangeText, range === r &&
  styles.rangeTextActive]}>{r}d</Text>
              </Pressable>
            ))}
          </View>

          {points.length === 0 ? (
            <Card style={styles.empty}>
              <Ionicons name="scale-outline" size={32} 
  color={palette.textFaint} />
              <Text style={styles.emptyText}>Log your weight to see the
  trend.</Text>
            </Card>
          ) : (
            <>
              <View style={styles.statRow}>
                <Stat value={`${current} ${unit}`} label="Current" 
  accent={accent} />
                <Stat
                  value={`${delta != null && delta >= 0 ? '+' :
  ''}${delta} ${unit}`}
                  label={`${range}-day change`}
                  accent={accent}
                />
              </View>
              <Card>
                <LineChart data={points} unit={unit} color={accent} />
              </Card>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  function Stat({ value, label, accent }: { value: string; label:
  string; accent: string }) {
    return (
      <Card style={styles.stat}>
        <Text style={[styles.statValue, { color: accent 
  }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap:
  spacing.sm },
    logRow: { flexDirection: 'row', gap: spacing.sm, alignItems:
  'center' },
    input: {
      flex: 1,
      color: palette.text,
      fontSize: font.size.md,
      backgroundColor: palette.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
    },
    saveBtn: { paddingHorizontal: spacing.lg },
    rangeRow: { flexDirection: 'row', gap: spacing.sm, marginTop:
  spacing.sm },
    rangeBtn: { paddingHorizontal: spacing.lg, paddingVertical:
  spacing.sm, borderRadius: radius.pill, backgroundColor:
  palette.surfaceAlt },
    rangeText: { color: palette.textMuted, fontSize: font.size.sm,
  fontFamily: font.family.uiSemibold },
    rangeTextActive: { color: palette.black },
    statRow: { flexDirection: 'row', gap: spacing.sm },
    stat: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { fontSize: font.size.xl, fontFamily: font.family.monoBold },
    statLabel: { color: palette.textMuted, fontSize: font.size.xs },
    empty: { alignItems: 'center', gap: spacing.md, paddingVertical:
  spacing.xxl },
    emptyText: { color: palette.textMuted, fontSize: font.size.md,
  textAlign: 'center' },
  });