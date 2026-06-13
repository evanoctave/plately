import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ring } from '../components/Ring';
import { MacroBars } from '../components/MacroBars';
import { MicrosGrid } from '../components/MicrosGrid';
import { WaterTracker } from '../components/WaterTracker';
import { EntryRow } from '../components/EntryRow';
import { QuickAdd } from '../components/QuickAdd';
import { Card, SectionTitle } from '../components/Card';
import { palette, spacing, font, radius } from '../theme';
import { ZERO_NUTRITION } from '../data/nutrients';
import { useSettings } from '../state/useSettings';
import { logEntry, removeEntry, useDayLog } from '../state/useDiary';
import { useQuickAdd, type QuickAddItem } from '../state/useQuickAdd';
import { nutritionForGrams } from '../utils/nutrition';
import { dayKey, prettyDay } from '../utils/date';
import type { TabScreenProps } from '../navigation/types';

const SPRING = { mass: 0.4, damping: 14, stiffness: 260 };

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const today = dayKey();
  const goals = useSettings((s) => s.goals);
  const accent = useSettings((s) => s.accent);
  const plusActive = useSettings((s) => s.plusActive);
  const { entries, totals } = useDayLog(today);
  const { items: quickAddItems } = useQuickAdd();

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>{prettyDay(today)}</Text>
            <Text style={styles.title}>Your day</Text>
          </View>
        </View>

        {/* Hero: calorie ring + macro bars — no card wrapper */}
        <View style={styles.hero}>
          <Ring
            progress={goals.calories > 0 ? totals.calories / goals.calories : 0}
            value={totals.calories}
            goal={goals.calories}
            label="Calories"
            unit="kcal"
            color={accent}
          />
          <View style={styles.macrosBlock}>
            <MacroBars
              protein={totals.protein}
              carbs={totals.carbs}
              fat={totals.fat}
              goals={goals}
            />
          </View>
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
              <Ionicons name="camera" size={22} color={palette.white} />
              <Text style={styles.snapText}>Snap a meal</Text>
            </Pressable>
          </Animated.View>

          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            onPress={() => navigation.navigate('Search')}
            accessibilityRole="button"
            accessibilityLabel="Search for a food to add"
          >
            <Ionicons name="search" size={20} color={palette.textMuted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            onPress={() => navigation.navigate('BarcodeScan')}
            accessibilityRole="button"
            accessibilityLabel="Scan a barcode"
          >
            <Ionicons name="barcode-outline" size={20} color={palette.textMuted} />
          </Pressable>
        </View>

        {/* Water */}
        <Card>
          <WaterTracker consumedMl={totals.water} goalMl={goals.water} onAdd={addWater} />
        </Card>

        {/* Smart Coach teaser */}
        {plusActive && entries.length > 0 && (
          <Pressable
            onPress={() => navigation.navigate('Coach')}
            style={({ pressed }) => [styles.coachCard, { borderColor: accent + '55' }, pressed && { opacity: 0.7 }]}
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
            <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
          </Pressable>
        )}

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

        {/* Logged today */}
        <SectionTitle>Logged today</SectionTitle>
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽</Text>
            <Text style={styles.emptyText}>Nothing logged yet.</Text>
            <Text style={styles.emptyHint}>Snap your first meal to get started.</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
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
  dateLabel: {
    color: palette.textFaint,
    fontSize: font.size.sm,
    fontFamily: font.family.uiMedium,
    letterSpacing: 0.3,
  },
  title: {
    color: palette.text,
    fontSize: font.size.xxl,
    fontFamily: font.family.uiBold,
    letterSpacing: -0.5,
  },

  // Hero section — ring + macros, no card
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  macrosBlock: {
    width: '100%',
    paddingHorizontal: spacing.sm,
  },

  // Actions row
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  snapWrap: { flex: 1 },
  snap: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapText: {
    color: palette.white,
    fontSize: font.size.lg,
    fontFamily: font.family.uiBold,
  },
  iconBtn: {
    width: 58,
    height: 58,
    borderRadius: radius.xl,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  iconBtnPressed: { opacity: 0.6 },

  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  coachIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  coachBody: { flex: 1 },
  coachTitle: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
  coachSub: { color: palette.textMuted, fontSize: font.size.sm, marginTop: 1 },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyEmoji: { fontSize: 36, marginBottom: spacing.sm },
  emptyText: {
    color: palette.text,
    fontSize: font.size.lg,
    fontFamily: font.family.uiSemibold,
  },
  emptyHint: {
    color: palette.textFaint,
    fontSize: font.size.sm,
  },

  entryList: { padding: 0, overflow: 'hidden' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
    marginHorizontal: spacing.lg,
  },
});
