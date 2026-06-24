import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { MicrosGrid } from '../components/MicrosGrid';
import { spacing, font, radius, macroColors } from '../theme';
import type { Palette } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { getFood } from '../data/catalog';
import { isFavorite, toggleFavorite } from '../db/favorites';
import { nutritionForGrams } from '../utils/nutrition';
import { fmt, fmtInt } from '../utils/format';
import { logEntry } from '../state/useDiary';
import { dayKey } from '../utils/date';
import type { RootStackScreenProps } from '../navigation/types';

const STEP_OPTIONS = [0.5, 1, 1.5, 2];

export function ConfirmFoodScreen({ route, navigation }: RootStackScreenProps<'ConfirmFood'>) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const { foodId, photoUri, source, suggestedGrams } = route.params;
  const food = getFood(foodId);
  const [grams, setGrams] = useState(suggestedGrams ?? food?.servingGrams ?? 100);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    let active = true;
    void isFavorite(foodId).then((v) => active && setFavorite(v));
    return () => {
      active = false;
    };
  }, [foodId]);

  const onToggleFavorite = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorite(await toggleFavorite(foodId));
  };

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

      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          <Text style={styles.name}>{food.name}</Text>
          <Text style={styles.category}>{food.category}</Text>
        </View>
        <Pressable
          onPress={() => void onToggleFavorite()}
          accessibilityRole="button"
          accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
          style={({ pressed }) => [styles.starBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons
            name={favorite ? 'star' : 'star-outline'}
            size={24}
            color={favorite ? p.amber : p.textMuted}
          />
        </Pressable>
      </View>

      <Card style={styles.portionCard}>
        <SectionTitle>Portion</SectionTitle>
        <View style={styles.gramRow}>
          <Pressable onPress={() => nudge(-10)} style={styles.stepBtn} accessibilityLabel="Decrease grams">
            <Ionicons name="remove" size={22} color={p.text} />
          </Pressable>
          <View style={styles.gramDisplay}>
            <Text style={styles.gramValue}>{fmtInt(grams)} g</Text>
            <Text style={styles.gramServings}>{fmt(servings)}× {food.servingLabel}</Text>
          </View>
          <Pressable onPress={() => nudge(10)} style={styles.stepBtn} accessibilityLabel="Increase grams">
            <Ionicons name="add" size={22} color={p.text} />
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
          <Macro label="Protein" value={nutrition.protein} color={macroColors.protein} styles={styles} />
          <Macro label="Carbs" value={nutrition.carbs} color={macroColors.carbs} styles={styles} />
          <Macro label="Fat" value={nutrition.fat} color={macroColors.fat} styles={styles} />
        </View>
        <View style={styles.subRow}>
          <Sub label="Fiber" value={`${fmt(nutrition.fiber)} g`} styles={styles} />
          <Sub label="Sugar" value={`${fmt(nutrition.sugar)} g`} styles={styles} />
          <Sub label="Water" value={`${fmtInt(nutrition.water)} mL`} styles={styles} />
        </View>
      </Card>

      <SectionTitle>Micronutrients</SectionTitle>
      <MicrosGrid nutrition={nutrition} />

      <Button label="Add to diary" onPress={save} style={styles.saveBtn} />
    </ScrollView>
  );
}

type ConfirmStyles = ReturnType<typeof makeStyles>;

function Macro({ label, value, color, styles }: { label: string; value: number; color: string; styles: ConfirmStyles }) {
  return (
    <View style={styles.macro}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroValue}>{fmt(value)} g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function Sub({ label, value, styles }: { label: string; value: string; styles: ConfirmStyles }) {
  return (
    <View style={styles.sub}>
      <Text style={styles.subValue}>{value}</Text>
      <Text style={styles.subLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(p: Palette) {
  return StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    photo: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: p.surfaceAlt },
    name: { color: p.text, fontSize: font.size.xxl, fontFamily: font.family.uiBold },
    category: { color: p.textMuted, fontSize: font.size.md, marginTop: 2 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
    titleText: { flex: 1 },
    starBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: p.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    portionCard: { gap: spacing.sm },
    gramRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepBtn: {
      width: 48, height: 48, borderRadius: radius.md, backgroundColor: p.surfaceAlt,
      alignItems: 'center', justifyContent: 'center',
    },
    gramDisplay: { alignItems: 'center' },
    gramValue: { color: p.text, fontSize: font.size.xl, fontFamily: font.family.monoBold },
    gramServings: { color: p.textMuted, fontSize: font.size.sm, marginTop: 2 },
    quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    quickChip: {
      flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: p.surfaceAlt,
      alignItems: 'center',
    },
    quickChipActive: { backgroundColor: p.green },
    quickChipText: { color: p.textMuted, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    quickChipTextActive: { color: p.black },
    calRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
    calValue: { color: p.text, fontSize: font.size.display, fontFamily: font.family.monoBold },
    calUnit: { color: p.textMuted, fontSize: font.size.lg },
    macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md },
    macro: { alignItems: 'center', gap: 4 },
    macroDot: { width: 10, height: 10, borderRadius: 5 },
    macroValue: { color: p.text, fontSize: font.size.lg, fontFamily: font.family.monoSemibold },
    macroLabel: { color: p.textMuted, fontSize: font.size.sm },
    subRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.border, paddingTop: spacing.md },
    sub: { alignItems: 'center', gap: 2 },
    subValue: { color: p.text, fontSize: font.size.md, fontFamily: font.family.mono },
    subLabel: { color: p.textFaint, fontSize: font.size.xs },
    saveBtn: { marginTop: spacing.lg },
    missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
    missingText: { color: p.textMuted, fontSize: font.size.lg },
  });
}
