import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { BarChart, type BarDatum } from '../components/BarChart';
import { Card, SectionTitle } from '../components/Card';
import { palette, spacing, font, radius, macroColors } from '../theme';
import { getDailyTotals, getAllLoggedDayKeys, type DayTotals } from '../db/stats';
import { useSettings } from '../state/useSettings';
import { useDiaryRevision } from '../state/useDiary';
import { lastNDays, average, computeStreak, dayOfMonth } from '../utils/stats';
import { dayKey } from '../utils/date';
import { fmt, fmtInt } from '../utils/format';
import { mlToDisplay } from '../state/useSettings';

const RANGE_DAYS = 14;

export function InsightsScreen() {
  const goals = useSettings((s) => s.goals);
  const waterUnit = useSettings((s) => s.waterUnit);
  const revision = useDiaryRevision((s) => s.revision);

  const [totals, setTotals] = useState<DayTotals[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const days = lastNDays(RANGE_DAYS);
      const [daily, allKeys] = await Promise.all([getDailyTotals(days), getAllLoggedDayKeys()]);
      setTotals(daily);
      setStreak(computeStreak(allKeys));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, revision]),
  );

  const loggedDays = totals.filter((d) => d.itemCount > 0 || d.water > 0);
  const activeDays = loggedDays.length;

  const avgCalories = average(loggedDays.map((d) => d.calories));
  const avgProtein = average(loggedDays.map((d) => d.protein));
  const avgWater = average(loggedDays.map((d) => d.water));

  const today = dayKey();
  const calorieBars: BarDatum[] = totals.map((d) => ({
    label: dayOfMonth(d.day),
    value: d.calories,
    highlight: d.day === today,
  }));

  const hasData = activeDays > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={palette.green} />}
      >
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>
          Trends, streaks and averages — free, on-device. No premium tier.
        </Text>

        {!hasData ? (
          <Card style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={32} color={palette.textFaint} />
            <Text style={styles.emptyText}>
              Log a few meals and your trends will appear here.
            </Text>
          </Card>
        ) : (
          <>
            <View style={styles.statRow}>
              <StatCard
                icon="flame"
                color={palette.amber}
                value={`${streak}`}
                label={streak === 1 ? 'day streak' : 'day streak'}
              />
              <StatCard
                icon="calendar"
                color={palette.teal}
                value={`${activeDays}`}
                label={`of ${RANGE_DAYS} days logged`}
              />
            </View>

            <SectionTitle>Calories · last {RANGE_DAYS} days</SectionTitle>
            <Card>
              <BarChart data={calorieBars} goal={goals.calories} unit="kcal" />
            </Card>

            <SectionTitle>Daily averages</SectionTitle>
            <Card style={styles.avgCard}>
              <AvgRow
                label="Calories"
                value={`${fmtInt(avgCalories)} kcal`}
                pct={goals.calories > 0 ? avgCalories / goals.calories : 0}
                color={palette.green}
              />
              <AvgRow
                label="Protein"
                value={`${fmt(avgProtein)} g`}
                pct={goals.protein > 0 ? avgProtein / goals.protein : 0}
                color={macroColors.protein}
              />
              <AvgRow
                label="Water"
                value={`${mlToDisplay(avgWater, waterUnit)} ${waterUnit}`}
                pct={goals.water > 0 ? avgWater / goals.water : 0}
                color={palette.water}
              />
              <Text style={styles.avgNote}>Averaged over days you logged.</Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AvgRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  const width = `${Math.max(0, Math.min(1, pct)) * 100}%` as const;
  return (
    <View style={styles.avgRow}>
      <View style={styles.avgHeader}>
        <Text style={styles.avgLabel}>{label}</Text>
        <Text style={styles.avgValue}>{value}</Text>
      </View>
      <View style={styles.avgTrack}>
        <View style={[styles.avgFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { color: palette.text, fontSize: font.size.xxl, fontWeight: font.weight.bold },
  subtitle: { color: palette.textMuted, fontSize: font.size.sm, marginTop: -spacing.sm },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  emptyText: { color: palette.textMuted, fontSize: font.size.md, textAlign: 'center', paddingHorizontal: spacing.lg },
  statRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  statValue: { color: palette.text, fontSize: font.size.xxl, fontWeight: font.weight.bold },
  statLabel: { color: palette.textMuted, fontSize: font.size.sm, textAlign: 'center' },
  avgCard: { gap: spacing.md },
  avgRow: { gap: spacing.xs },
  avgHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  avgLabel: { color: palette.text, fontSize: font.size.md, fontWeight: font.weight.medium },
  avgValue: { color: palette.textMuted, fontSize: font.size.sm },
  avgTrack: { height: 8, borderRadius: radius.pill, backgroundColor: palette.surfaceAlt, overflow: 'hidden' },
  avgFill: { height: '100%', borderRadius: radius.pill },
  avgNote: { color: palette.textFaint, fontSize: font.size.xs },
});
