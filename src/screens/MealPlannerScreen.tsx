import { useCallback, useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { addDays, format } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { Card, SectionTitle } from '../components/Card';
import { Button } from '../components/Button';
import { MacroBars } from '../components/MacroBars';
import { PlusLock } from '../components/PlusLock';
import { spacing, font, radius } from '../theme';
import { usePlus } from '../state/usePlus';
import { useSettings } from '../state/useSettings';
import { logEntry } from '../state/useDiary';
import {
  addPlanItem,
  clearPlanForDay,
  deletePlanItem,
  getPlanForDay,
  type PlanItem,
} from '../db/mealPlan';
import { searchFoods, type FoodItem } from '../data/foods';
import { nutritionForGrams, sumNutrition } from '../utils/nutrition';
import { ZERO_NUTRITION } from '../data/nutrients';
import { dayKey } from '../utils/date';
import { fmtInt } from '../utils/format';
import type { RootStackScreenProps } from '../navigation/types';

const DAY_COUNT = 7;

export function MealPlannerScreen({ navigation }: RootStackScreenProps<'MealPlanner'>) {
  const { active } = usePlus();
  if (!active) {
    return (
      <PlusLock
        icon="calendar"
        title="Meal planner"
        description="Plan meals for the days ahead, preview the nutrition before you eat, then log the whole day in one tap."
        highlights={[
          'Plan up to a week in advance',
          'See projected calories and macros',
          'Log a planned day to your diary instantly',
        ]}
        onSeePlus={() => navigation.navigate('PlatelyPlus')}
      />
    );
  }
  return <MealPlanner />;
}

function MealPlanner() {
  const p = useTheme();
  const accent = useSettings((s) => s.accent);
  const goals = useSettings((s) => s.goals);

  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: DAY_COUNT }, (_, i) => dayKey(addDays(base, i)));
  }, []);

  const [selectedDay, setSelectedDay] = useState(days[0]!);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setItems(await getPlanForDay(selectedDay));
  }, [selectedDay]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const results = useMemo(() => (query.trim() ? searchFoods(query, 12) : []), [query]);
  const projected = useMemo(() => sumNutrition(items.length ? items : [ZERO_NUTRITION]), [items]);
  const styles = useMemo(() => makeStyles(p), [p]);

  const addFood = async (food: FoodItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addPlanItem({
      day: selectedDay,
      foodId: food.id,
      name: food.name,
      grams: food.servingGrams,
      nutrition: nutritionForGrams(food, food.servingGrams),
    });
    setQuery('');
    await load();
  };

  const removeItem = async (id: string) => {
    await deletePlanItem(id);
    await load();
  };

  const logDay = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Log this day?',
      `Add ${items.length} planned ${items.length === 1 ? 'item' : 'items'} to your diary for ${format(new Date(`${selectedDay}T00:00:00`), 'EEE, MMM d')}, then clear the plan.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log day',
          onPress: async () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            for (const item of items) {
              await logEntry({
                day: selectedDay,
                foodId: item.foodId,
                name: item.name,
                grams: item.grams,
                photoUri: null,
                source: item.foodId ? 'search' : 'manual',
                nutrition: pickNutrition(item),
              });
            }
            await clearPlanForDay(selectedDay);
            await load();
          },
        },
      ],
    );
  };

  const calPct = goals.calories > 0 ? Math.min(1, projected.calories / goals.calories) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayStrip}
        >
          {days.map((d, i) => {
            const on = d === selectedDay;
            const date = new Date(`${d}T00:00:00`);
            return (
              <Pressable
                key={d}
                onPress={() => setSelectedDay(d)}
                style={[styles.dayChip, on && { backgroundColor: accent, borderColor: accent }]}
              >
                <Text style={[styles.dayChipDow, on && styles.dayChipOn]}>
                  {i === 0 ? 'Today' : format(date, 'EEE')}
                </Text>
                <Text style={[styles.dayChipNum, on && styles.dayChipOn]}>{format(date, 'd')}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Card style={styles.projection}>
          <View style={styles.projHeader}>
            <Text style={styles.projTitle}>Projected</Text>
            <Text style={styles.projCal}>
              {fmtInt(projected.calories)}
              <Text style={styles.projCalGoal}> / {fmtInt(goals.calories)} kcal</Text>
            </Text>
          </View>
          <View style={styles.projTrack}>
            <View style={[styles.projFill, { width: `${calPct * 100}%`, backgroundColor: accent }]} />
          </View>
          <View style={styles.macroWrap}>
            <MacroBars protein={projected.protein} carbs={projected.carbs} fat={projected.fat} goals={goals} />
          </View>
        </Card>

        <SectionTitle>Add to this day</SectionTitle>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={p.textFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods to plan"
            placeholderTextColor={p.textFaint}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={p.textFaint} />
            </Pressable>
          )}
        </View>

        {results.length > 0 && (
          <Card style={styles.results}>
            {results.map((f, i) => (
              <View key={f.id}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable style={styles.resultRow} onPress={() => void addFood(f)}>
                  <View style={styles.resultBody}>
                    <Text style={styles.resultName} numberOfLines={1}>{f.name}</Text>
                    <Text style={styles.resultMeta}>{f.servingLabel}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={accent} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}

        <SectionTitle>Planned</SectionTitle>
        {items.length === 0 ? (
          <Card style={styles.empty}>
            <Ionicons name="calendar-outline" size={28} color={p.textFaint} />
            <Text style={styles.emptyText}>Nothing planned for this day yet.</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.planList}>
              {items.map((item, i) => (
                <View key={item.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.planRow}>
                    <View style={styles.planBody}>
                      <Text style={styles.planName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.planMeta}>{fmtInt(item.grams)} g · {fmtInt(item.calories)} kcal</Text>
                    </View>
                    <Pressable onPress={() => void removeItem(item.id)} hitSlop={8} accessibilityLabel={`Remove ${item.name}`}>
                      <Ionicons name="close-circle-outline" size={22} color={p.textFaint} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </Card>
            <Button label="Log this day to diary" onPress={logDay} style={styles.logBtn} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function pickNutrition(item: PlanItem) {
  const keys = Object.keys(ZERO_NUTRITION) as (keyof typeof ZERO_NUTRITION)[];
  const out = { ...ZERO_NUTRITION };
  for (const k of keys) out[k] = item[k];
  return out;
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    dayStrip: { gap: spacing.sm, paddingVertical: spacing.xs },
    dayChip: {
      width: 56,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: p.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      alignItems: 'center',
      gap: 2,
    },
    dayChipDow: { color: p.textMuted, fontSize: font.size.xs, fontFamily: font.family.uiMedium },
    dayChipNum: { color: p.text, fontSize: font.size.lg, fontFamily: font.family.monoBold },
    dayChipOn: { color: p.white },
    projection: { gap: spacing.md },
    projHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    projTitle: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiSemibold, textTransform: 'uppercase', letterSpacing: 0.6 },
    projCal: { color: p.text, fontSize: font.size.lg, fontFamily: font.family.monoBold },
    projCalGoal: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.mono },
    projTrack: { height: 8, borderRadius: radius.pill, backgroundColor: p.surfaceAlt, overflow: 'hidden' },
    projFill: { height: '100%', borderRadius: radius.pill },
    macroWrap: { marginTop: spacing.xs },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: p.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    searchInput: { flex: 1, color: p.text, fontSize: font.size.md, paddingVertical: spacing.md },
    results: { paddingVertical: spacing.xs },
    resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    resultBody: { flex: 1 },
    resultName: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiMedium },
    resultMeta: { color: p.textMuted, fontSize: font.size.sm, marginTop: 1 },
    empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
    emptyText: { color: p.textMuted, fontSize: font.size.md, textAlign: 'center' },
    planList: { paddingVertical: spacing.xs },
    planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    planBody: { flex: 1 },
    planName: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiMedium },
    planMeta: { color: p.textMuted, fontSize: font.size.sm, marginTop: 1 },
    logBtn: { marginTop: spacing.xs },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.border },
  });
}
