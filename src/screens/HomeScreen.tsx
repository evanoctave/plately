import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
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

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const today = dayKey();
  const goals = useSettings((s) => s.goals);
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>{prettyDay(today)}</Text>
            <Text style={styles.title}>Your day</Text>
          </View>
        </View>

        <Card style={styles.ringCard}>
          <Ring
            progress={goals.calories > 0 ? totals.calories / goals.calories : 0}
            value={totals.calories}
            goal={goals.calories}
            label="Calories"
            unit="kcal"
          />
          <View style={styles.ringSide}>
            <MacroBars
              protein={totals.protein}
              carbs={totals.carbs}
              fat={totals.fat}
              goals={goals}
            />
          </View>
        </Card>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.snap, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Camera')}
            accessibilityRole="button"
            accessibilityLabel="Snap a photo of your meal"
          >
            <Ionicons name="camera" size={24} color={palette.black} />
            <Text style={styles.snapText}>Snap a meal</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.search, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Search')}
            accessibilityRole="button"
            accessibilityLabel="Search for a food to add"
          >
            <Ionicons name="search" size={22} color={palette.text} />
          </Pressable>
        </View>

        <Card>
          <WaterTracker consumedMl={totals.water} goalMl={goals.water} onAdd={addWater} />
        </Card>

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

        <SectionTitle>Logged today</SectionTitle>
        {entries.length === 0 ? (
          <Card style={styles.empty}>
            <Ionicons name="fast-food-outline" size={28} color={palette.textFaint} />
            <Text style={styles.emptyText}>Nothing logged yet. Snap your first meal!</Text>
          </Card>
        ) : (
          <Card>
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

        <Text style={styles.hint}>Tip: long-press an entry to remove it.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateLabel: { color: palette.textMuted, fontSize: font.size.sm },
  title: { color: palette.text, fontSize: font.size.xxl, fontWeight: font.weight.bold },
  ringCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringSide: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.md },
  snap: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: palette.green,
    minHeight: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapText: { color: palette.black, fontSize: font.size.lg, fontWeight: font.weight.bold },
  search: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  pressed: { opacity: 0.85 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { color: palette.textMuted, fontSize: font.size.md, textAlign: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  hint: { color: palette.textFaint, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.sm },
});
