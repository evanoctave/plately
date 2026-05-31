import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { MicrosGrid } from '../components/MicrosGrid';
import { palette, spacing, font, radius, macroColors } from '../theme';
import { getFoodById } from '../data/foods';
import { nutritionForGrams } from '../utils/nutrition';
import { fmt, fmtInt } from '../utils/format';
import { logEntry } from '../state/useDiary';
import { dayKey } from '../utils/date';
import type { RootStackScreenProps } from '../navigation/types';

const STEP_OPTIONS = [0.5, 1, 1.5, 2];

export function ConfirmFoodScreen({ route, navigation }: RootStackScreenProps<'ConfirmFood'>) {
  const { foodId, photoUri, source, suggestedGrams } = route.params;
  const food = getFoodById(foodId);
  const [grams, setGrams] = useState(suggestedGrams ?? food?.servingGrams ?? 100);

  const nutrition = useMemo(
    () => (food ? nutritionForGrams(food, grams) : null),
    [food, grams],
  );

  if (!food || !nutrition) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This food is no longer available.</Text>
        <Button label="Go back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const servings = grams / food.servingGrams;

  const setServings = (mult: number) => setGrams(Math.round(food.servingGrams * mult));
  const nudge = (delta: number) => setGrams((g) => Math.max(5, Math.round(g + delta)));

  const save = () => {
    void logEntry({
      day: dayKey(),
      foodId: food.id,
      name: food.name,
      grams,
      photoUri: photoUri ?? null,
      source,
      nutrition,
    });
    navigation.navigate('Tabs');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" transition={150} />
      )}

      <View>
        <Text style={styles.name}>{food.name}</Text>
        <Text style={styles.category}>{food.category}</Text>
      </View>

      <Card style={styles.portionCard}>
        <SectionTitle>Portion</SectionTitle>
        <View style={styles.gramRow}>
          <Pressable onPress={() => nudge(-10)} style={styles.stepBtn} accessibilityLabel="Decrease grams">
            <Ionicons name="remove" size={22} color={palette.text} />
          </Pressable>
          <View style={styles.gramDisplay}>
            <Text style={styles.gramValue}>{fmtInt(grams)} g</Text>
            <Text style={styles.gramServings}>{fmt(servings)}× {food.servingLabel}</Text>
          </View>
          <Pressable onPress={() => nudge(10)} style={styles.stepBtn} accessibilityLabel="Increase grams">
            <Ionicons name="add" size={22} color={palette.text} />
          </Pressable>
        </View>
        <View style={styles.quickRow}>
          {STEP_OPTIONS.map((mult) => {
            const active = Math.abs(servings - mult) < 0.01;
            return (
              <Pressable
                key={mult}
                onPress={() => setServings(mult)}
                style={[styles.quickChip, active && styles.quickChipActive]}
              >
                <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>{mult}×</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <View style={styles.calRow}>
          <Text style={styles.calValue}>{fmtInt(nutrition.calories)}</Text>
          <Text style={styles.calUnit}>kcal</Text>
        </View>
        <View style={styles.macroRow}>
          <Macro label="Protein" value={nutrition.protein} color={macroColors.protein} />
          <Macro label="Carbs" value={nutrition.carbs} color={macroColors.carbs} />
          <Macro label="Fat" value={nutrition.fat} color={macroColors.fat} />
        </View>
        <View style={styles.subRow}>
          <Sub label="Fiber" value={`${fmt(nutrition.fiber)} g`} />
          <Sub label="Sugar" value={`${fmt(nutrition.sugar)} g`} />
          <Sub label="Water" value={`${fmtInt(nutrition.water)} mL`} />
        </View>
      </Card>

      <SectionTitle>Micronutrients</SectionTitle>
      <MicrosGrid nutrition={nutrition} />

      <Button label="Add to diary" onPress={save} style={styles.saveBtn} />
    </ScrollView>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macro}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroValue}>{fmt(value)} g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function Sub({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sub}>
      <Text style={styles.subValue}>{value}</Text>
      <Text style={styles.subLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  photo: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: palette.surfaceAlt },
  name: { color: palette.text, fontSize: font.size.xxl, fontWeight: font.weight.bold },
  category: { color: palette.textMuted, fontSize: font.size.md, marginTop: 2 },
  portionCard: { gap: spacing.sm },
  gramRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    width: 48, height: 48, borderRadius: radius.md, backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  gramDisplay: { alignItems: 'center' },
  gramValue: { color: palette.text, fontSize: font.size.xl, fontWeight: font.weight.bold },
  gramServings: { color: palette.textMuted, fontSize: font.size.sm, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickChip: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
  },
  quickChipActive: { backgroundColor: palette.green },
  quickChipText: { color: palette.textMuted, fontSize: font.size.md, fontWeight: font.weight.semibold },
  quickChipTextActive: { color: palette.black },
  calRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  calValue: { color: palette.text, fontSize: font.size.display, fontWeight: font.weight.bold },
  calUnit: { color: palette.textMuted, fontSize: font.size.lg },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md },
  macro: { alignItems: 'center', gap: 4 },
  macroDot: { width: 10, height: 10, borderRadius: 5 },
  macroValue: { color: palette.text, fontSize: font.size.lg, fontWeight: font.weight.semibold },
  macroLabel: { color: palette.textMuted, fontSize: font.size.sm },
  subRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border, paddingTop: spacing.md },
  sub: { alignItems: 'center', gap: 2 },
  subValue: { color: palette.text, fontSize: font.size.md, fontWeight: font.weight.medium },
  subLabel: { color: palette.textFaint, fontSize: font.size.xs },
  saveBtn: { marginTop: spacing.lg },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  missingText: { color: palette.textMuted, fontSize: font.size.lg },
});
