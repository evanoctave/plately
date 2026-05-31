import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { palette, spacing, font } from '../theme';
import { getEntriesForDay, getLoggedDays } from '../db/database';
import { sumNutrition } from '../utils/nutrition';
import { prettyDay } from '../utils/date';
import { fmtInt } from '../utils/format';
import { useSettings } from '../state/useSettings';
import { useDiaryRevision } from '../state/useDiary';
import type { TabScreenProps } from '../navigation/types';

interface DaySummary {
  day: string;
  calories: number;
  water: number;
  count: number;
}

export function HistoryScreen({ navigation }: TabScreenProps<'History'>) {
  const goals = useSettings((s) => s.goals);
  const revision = useDiaryRevision((s) => s.revision);
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(false);

  // `revision` is included so the list refetches whenever the diary changes
  // (e.g. an entry added on another screen) while History is focused.
  const load = useCallback(async () => {
    void revision;
    setLoading(true);
    try {
      const keys = await getLoggedDays();
      const summaries = await Promise.all(
        keys.map(async (day) => {
          const entries = await getEntriesForDay(day);
          const totals = sumNutrition(entries);
          return { day, calories: totals.calories, water: totals.water, count: entries.length };
        }),
      );
      setDays(summaries);
    } finally {
      setLoading(false);
    }
  }, [revision]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const renderItem = ({ item }: { item: DaySummary }) => {
    const pct = goals.calories > 0 ? Math.round((item.calories / goals.calories) * 100) : 0;
    return (
      <Pressable
        onPress={() => navigation.navigate('DayDetail', { day: item.day })}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.rowBody}>
          <Text style={styles.day}>{prettyDay(item.day)}</Text>
          <Text style={styles.meta}>
            {item.count} {item.count === 1 ? 'item' : 'items'} · 💧 {fmtInt(item.water)} mL
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.cal}>{fmtInt(item.calories)} kcal</Text>
          <Text style={styles.pct}>{pct}% of goal</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={days}
        keyExtractor={(item) => item.day}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={palette.green} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={36} color={palette.textFaint} />
            <Text style={styles.emptyText}>No history yet. Logged days will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  title: { color: palette.text, fontSize: font.size.xxl, fontWeight: font.weight.bold, padding: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  pressed: { opacity: 0.6 },
  rowBody: { flex: 1, gap: 2 },
  day: { color: palette.text, fontSize: font.size.lg, fontWeight: font.weight.semibold },
  meta: { color: palette.textMuted, fontSize: font.size.sm },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  cal: { color: palette.text, fontSize: font.size.md, fontWeight: font.weight.semibold },
  pct: { color: palette.textFaint, fontSize: font.size.xs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl * 2 },
  emptyText: { color: palette.textMuted, fontSize: font.size.md, textAlign: 'center', paddingHorizontal: spacing.xl },
});
