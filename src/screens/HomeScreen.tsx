import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ring } from '../components/Ring';
import { MicrosGrid } from '../components/MicrosGrid';
import { WaterTracker } from '../components/WaterTracker';
import { EntryRow } from '../components/EntryRow';
import { QuickAdd } from '../components/QuickAdd';
import { Card, SectionTitle } from '../components/Card';
import { spacing, font, radius, shadow, macroColors } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { ZERO_NUTRITION } from '../data/nutrients';
import { useSettings } from '../state/useSettings';
import { logEntry, removeEntry, useDayLog, useDiaryRevision } from '../state/useDiary';
import { useQuickAdd, type QuickAddItem } from '../state/useQuickAdd';
import { getLoggedDays } from '../db/database';
import { computeStreak } from '../utils/stats';
import { nutritionForGrams } from '../utils/nutrition';
import { dayKey } from '../utils/date';
import { fmtInt } from '../utils/format';
import type { TabScreenProps } from '../navigation/types';

const SPRING = { mass: 0.4, damping: 14, stiffness: 260 };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarStrip({ today, p }: { today: Date; p: ReturnType<typeof useTheme> }) {
  const calStyles = useMemo(() => makeCalStyles(p), [p]);

  const week = useMemo(() => {
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [today]);

  const todayKey = today.toDateString();

  return (
    <View style={calStyles.strip}>
      {week.map((d, i) => {
        const isToday = d.toDateString() === todayKey;
        return (
          <View key={i} style={calStyles.day}>
            <Text style={[calStyles.dow, isToday && calStyles.dowToday]}>{DAY_NAMES[i]}</Text>
            <View style={[calStyles.numWrap, isToday && calStyles.numWrapToday]}>
              <Text style={[calStyles.num, isToday && calStyles.numToday]}>{d.getDate()}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function makeCalStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    strip: { flexDirection: 'row', justifyContent: 'space-between' },
    day: { alignItems: 'center', gap: 6, flex: 1 },
    dow: { color: p.textFaint, fontSize: font.size.xs, fontFamily: font.family.uiMedium, letterSpacing: 0.4 },
    dowToday: { color: p.text },
    numWrap: {
      width: 36, height: 36, borderRadius: radius.pill,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent',
    },
    numWrapToday: {
      backgroundColor: p.text,
    },
    num: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    numToday: { color: p.white },
  });
}

interface MacroCardProps {
  label: string;
  remaining: number;
  unit?: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress: number;
  p: ReturnType<typeof useTheme>;
}

function MacroCard({ label, remaining, unit = 'g', color, icon, progress, p }: MacroCardProps) {
  const macroStyles = useMemo(() => makeMacroStyles(p), [p]);
  return (
    <View style={macroStyles.card}>
      <Text style={macroStyles.value}>
        {fmtInt(Math.max(0, remaining))}
        <Text style={macroStyles.unit}>{unit}</Text>
      </Text>
      <Text style={macroStyles.label}>{label} left</Text>
      <View style={macroStyles.ringWrap}>
        <Ring progress={progress} size={32} strokeWidth={4} color={color} icon={icon} iconColor={color} />
      </View>
    </View>
  );
}

function makeMacroStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      minHeight: 96,
      ...shadow.card,
    },
    value: {
      color: p.text,
      fontSize: font.size.xl,
      fontFamily: font.family.uiBold,
      letterSpacing: -0.6,
    },
    unit: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    label: { color: p.textMuted, fontSize: font.size.xs, fontFamily: font.family.uiMedium, marginTop: 1 },
    ringWrap: { position: 'absolute', right: spacing.md, bottom: spacing.md },
  });
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl + 16,
      gap: spacing.md,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    brand: {
      color: p.text,
      fontSize: font.size.xl,
      fontFamily: font.family.uiBold,
      letterSpacing: -0.5,
    },
    streakChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: p.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    streakNum: { color: p.text, fontSize: font.size.sm, fontFamily: font.family.monoSemibold },

    // Big calorie card
    calorieCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      ...shadow.card,
    },
    calNumber: {
      color: p.text,
      fontSize: 44,
      fontFamily: font.family.uiBold,
      letterSpacing: -1.2,
      lineHeight: 48,
    },
    calLabel: {
      color: p.textMuted,
      fontSize: font.size.md,
      fontFamily: font.family.uiMedium,
      marginTop: 2,
    },
    calMeta: {
      color: p.textFaint,
      fontSize: font.size.xs,
      fontFamily: font.family.mono,
      marginTop: 4,
    },

    // Macro row
    macroRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    // Actions row
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    snapWrap: { flex: 1 },
    snap: {
      flexDirection: 'row',
      gap: spacing.sm,
      minHeight: 48,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    snapText: {
      color: p.white,
      fontSize: font.size.md,
      fontFamily: font.family.uiBold,
    },
    iconBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: p.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    iconBtnPressed: { opacity: 0.6 },

    coachCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      ...shadow.card,
    },
    coachIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    coachBody: { flex: 1 },
    coachTitle: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    coachSub: { color: p.textMuted, fontSize: font.size.sm, marginTop: 1 },

    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    emptyEmoji: { fontSize: 32, marginBottom: spacing.xs },
    emptyText: {
      color: p.text,
      fontSize: font.size.md,
      fontFamily: font.family.uiSemibold,
    },
    emptyHint: {
      color: p.textFaint,
      fontSize: font.size.sm,
    },

    entryList: { padding: 0, overflow: 'hidden' },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: p.border,
      marginHorizontal: spacing.lg,
    },
  });
}

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);

  const today = dayKey();
  const goals = useSettings((s) => s.goals);
  const accent = useSettings((s) => s.accent);
  const plusActive = useSettings((s) => s.plusActive);
  const { entries, totals } = useDayLog(today);
  const { items: quickAddItems } = useQuickAdd();

  const revision = useDiaryRevision((s) => s.revision);
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    let alive = true;
    void getLoggedDays(60).then((days) => {
      if (alive) setStreak(computeStreak(days));
    });
    return () => { alive = false; };
  }, [revision]);

  const quickLog = useCallback(
    (item: QuickAddItem) => {
      void logEntry({
        day: today,
        foodId: item.food.id,
        name: item.food.name,
        grams: item.grams,
        photoUri: null,
        source: 'search',
        nutrition: nutritionForGrams(item.food, item.grams),
      });
    },
    [today],
  );

  const addWater = useCallback(
    (ml: number) => {
      void logEntry({
        day: today,
        foodId: 'water',
        name: 'Water',
        grams: ml,
        photoUri: null,
        source: 'water',
        nutrition: { ...ZERO_NUTRITION, water: ml },
      });
    },
    [today],
  );

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Remove entry', `Remove "${name}" from today?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void removeEntry(id) },
    ]);
  };

  const snapScale = useSharedValue(1);
  const snapAnimated = useAnimatedStyle(() => ({ transform: [{ scale: snapScale.value }] }));

  const calProgress = goals.calories > 0 ? totals.calories / goals.calories : 0;
  const calsLeft = Math.max(0, goals.calories - totals.calories);
  const over = totals.calories > goals.calories;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>EvoEat</Text>
          <Pressable
            style={({ pressed }) => [styles.streakChip, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Achievements')}
            accessibilityRole="button"
            accessibilityLabel="View achievements"
          >
            <Ionicons name="flame" size={14} color={p.amber} />
            <Text style={styles.streakNum}>{streak}</Text>
          </Pressable>
        </View>

        {/* Week strip */}
        <CalendarStrip today={new Date()} p={p} />

        {/* Big calorie card */}
        <View style={styles.calorieCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.calNumber}>
              {fmtInt(over ? totals.calories - goals.calories : calsLeft)}
            </Text>
            <Text style={styles.calLabel}>{over ? 'Calories over' : 'Calories left'}</Text>
            <Text style={styles.calMeta}>of {fmtInt(goals.calories)} kcal goal</Text>
          </View>
          <Ring
            progress={calProgress}
            size={84}
            strokeWidth={8}
            color={over ? p.amber : accent}
            icon="flame"
            iconColor={p.text}
          />
        </View>

        {/* Macro row */}
        <View style={styles.macroRow}>
          <MacroCard
            label="Protein"
            remaining={goals.protein - totals.protein}
            color={macroColors.protein}
            icon="fitness"
            progress={goals.protein > 0 ? totals.protein / goals.protein : 0}
            p={p}
          />
          <MacroCard
            label="Carbs"
            remaining={goals.carbs - totals.carbs}
            color={macroColors.carbs}
            icon="leaf"
            progress={goals.carbs > 0 ? totals.carbs / goals.carbs : 0}
            p={p}
          />
          <MacroCard
            label="Fat"
            remaining={goals.fat - totals.fat}
            color={macroColors.fat}
            icon="water"
            progress={goals.fat > 0 ? totals.fat / goals.fat : 0}
            p={p}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Animated.View style={[styles.snapWrap, snapAnimated]}>
            <Pressable
              style={[styles.snap, { backgroundColor: accent }]}
              onPress={() => navigation.navigate('Camera')}
              onPressIn={() => { snapScale.value = withSpring(0.96, SPRING); }}
              onPressOut={() => { snapScale.value = withSpring(1, SPRING); }}
              accessibilityRole="button"
              accessibilityLabel="Snap a photo of your meal"
            >
              <Ionicons name="camera" size={20} color={p.white} />
              <Text style={styles.snapText}>Snap a meal</Text>
            </Pressable>
          </Animated.View>

          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            onPress={() => navigation.navigate('Search')}
            accessibilityRole="button"
            accessibilityLabel="Search for a food to add"
          >
            <Ionicons name="search" size={20} color={p.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            onPress={() => navigation.navigate('BarcodeScan')}
            accessibilityRole="button"
            accessibilityLabel="Scan a barcode"
          >
            <Ionicons name="barcode-outline" size={20} color={p.text} />
          </Pressable>
        </View>

        {/* Quick add */}
        {quickAddItems.length > 0 && (
          <>
            <SectionTitle>Quick add</SectionTitle>
            <QuickAdd
              items={quickAddItems}
              onQuickLog={quickLog}
              onOpen={(item) =>
                navigation.navigate('ConfirmFood', {
                  foodId: item.food.id,
                  source: 'search',
                  suggestedGrams: item.grams,
                })
              }
            />
          </>
        )}

        {/* Smart Coach teaser */}
        {plusActive && entries.length > 0 && (
          <Pressable
            onPress={() => navigation.navigate('Coach')}
            style={({ pressed }) => [styles.coachCard, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Open Smart Coach"
          >
            <View style={[styles.coachIcon, { backgroundColor: accent + '22' }]}>
              <Ionicons name="bulb" size={18} color={accent} />
            </View>
            <View style={styles.coachBody}>
              <Text style={styles.coachTitle}>Smart Coach</Text>
              <Text style={styles.coachSub}>See today's guidance from your log</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={p.textFaint} />
          </Pressable>
        )}

        {/* Recently logged */}
        <SectionTitle>Recently logged</SectionTitle>
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽</Text>
            <Text style={styles.emptyText}>Nothing logged yet</Text>
            <Text style={styles.emptyHint}>Tap + or snap your first meal</Text>
          </View>
        ) : (
          <Card style={styles.entryList}>
            {entries.map((entry, i) => (
              <View key={entry.id}>
                {i > 0 && <View style={styles.divider} />}
                <EntryRow
                  entry={entry}
                  onLongPress={() => confirmDelete(entry.id, entry.name)}
                  onPress={() =>
                    entry.foodId
                      ? navigation.navigate('ConfirmFood', {
                          foodId: entry.foodId,
                          source: entry.source,
                          suggestedGrams: entry.grams,
                        })
                      : undefined
                  }
                />
              </View>
            ))}
          </Card>
        )}

        {/* Water */}
        <Card>
          <WaterTracker consumedMl={totals.water} goalMl={goals.water} onAdd={addWater} />
        </Card>

        {entries.length > 0 && (
          <>
            <SectionTitle>Micronutrients</SectionTitle>
            <MicrosGrid nutrition={totals} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
