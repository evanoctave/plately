import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle } from '../components/Card';
import { Button } from '../components/Button';
import { spacing, font, radius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../state/useSettings';
import { searchCatalog, refreshCustomFoods } from '../data/catalog';
import { addCustomFood } from '../db/customFoods';
import { nutritionForGrams, sumNutrition, round } from '../utils/nutrition';
import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';
import type { FoodItem } from '../data/foods';
import type { RootStackScreenProps } from '../navigation/types';

interface Ingredient {
  key: string;
  food: FoodItem;
  grams: number;
}

export function RecipeBuilderScreen({ navigation }: RootStackScreenProps<'RecipeBuilder'>) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const accent = useSettings((s) => s.accent);
  const [name, setName] = useState('');
  const [servings, setServings] = useState('1');
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const results = useMemo(() => (query.trim() ? searchCatalog(query, 12) : []), [query]);

  const totalGrams = ingredients.reduce((sum, i) => sum + i.grams, 0);
  const total: Nutrition = useMemo(
    () =>
      ingredients.length
        ? sumNutrition(ingredients.map((i) => nutritionForGrams(i.food, i.grams)))
        : ZERO_NUTRITION,
    [ingredients],
  );

  const servingsNum = Math.max(1, parseInt(servings.replace(/[^0-9]/g, ''), 10) || 1);
  const perServing = (key: keyof Nutrition) => round(total[key] / servingsNum);

  const addIngredient = (food: FoodItem) => {
    setIngredients((prev) => [
      ...prev,
      { key: `${food.id}-${Date.now()}`, food, grams: food.servingGrams || 100 },
    ]);
    setQuery('');
  };

  const setGrams = (key: string, text: string) => {
    const g = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setIngredients((prev) =>
      prev.map((i) => (i.key === key ? { ...i, grams: Number.isFinite(g) ? g : 0 } : i)),
    );
  };

  const remove = (key: string) =>
    setIngredients((prev) => prev.filter((i) => i.key !== key));

  const canSave = name.trim().length > 0 && ingredients.length > 0 && totalGrams > 0;

  const save = async () => {
    if (!canSave) return;
    const per100g = { ...ZERO_NUTRITION };
    for (const key of Object.keys(ZERO_NUTRITION) as (keyof Nutrition)[]) {
      per100g[key] = round((total[key] / totalGrams) * 100);
    }
    const servingGrams = round(totalGrams / servingsNum);
    await addCustomFood({
      name: name.trim(),
      category: 'Recipe',
      servingGrams,
      servingLabel: `1 serving (${Math.round(servingGrams)} g)`,
      per100g,
    });
    await refreshCustomFoods();
    Alert.alert('Recipe saved', `"${name.trim()}" is now in your foods — log it like any other.`, [
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionTitle>Recipe name</SectionTitle>
        <TextInput
          style={styles.input}
          placeholder="e.g. Protein overnight oats"
          placeholderTextColor={p.textFaint}
          value={name}
          onChangeText={setName}
          maxLength={60}
        />

        <SectionTitle>Add ingredients</SectionTitle>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={p.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods to add"
            placeholderTextColor={p.textFaint}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>
        {results.length > 0 && (
          <Card style={styles.resultsCard}>
            {results.map((f, i) => (
              <View key={f.id}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable
                  style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.6 }]}
                  onPress={() => addIngredient(f)}
                >
                  <Text style={styles.resultName} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Ionicons name="add-circle" size={22} color={accent} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}

        {ingredients.length > 0 && (
          <Card style={styles.card}>
            {ingredients.map((ing, i) => (
              <View key={ing.key}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.ingRow}>
                  <Text style={styles.ingName} numberOfLines={1}>
                    {ing.food.name}
                  </Text>
                  <TextInput
                    style={styles.gramsInput}
                    keyboardType="number-pad"
                    value={String(ing.grams)}
                    onChangeText={(t) => setGrams(ing.key, t)}
                    maxLength={5}
                  />
                  <Text style={styles.gramsUnit}>g</Text>
                  <Pressable onPress={() => remove(ing.key)} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={p.textFaint} />
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>
        )}

        <SectionTitle>Servings</SectionTitle>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={servings}
          onChangeText={setServings}
          maxLength={3}
        />

        {ingredients.length > 0 && (
          <Card style={[styles.card, styles.totalsCard]}>
            <Text style={styles.totalsTitle}>Per serving</Text>
            <View style={styles.macroRow}>
              <Macro label="Cal" value={`${Math.round(perServing('calories'))}`} accent={accent} styles={styles} />
              <Macro label="Protein" value={`${perServing('protein')}g`} accent={accent} styles={styles} />
              <Macro label="Carbs" value={`${perServing('carbs')}g`} accent={accent} styles={styles} />
              <Macro label="Fat" value={`${perServing('fat')}g`} accent={accent} styles={styles} />
            </View>
            <Text style={styles.totalsMeta}>
              {servingsNum} serving{servingsNum > 1 ? 's' : ''} · {Math.round(totalGrams)} g total
            </Text>
          </Card>
        )}

        <Button label="Save recipe" onPress={() => void save()} disabled={!canSave} style={styles.save} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({ label, value, accent, styles }: { label: string; value: string; accent: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.macro}>
      <Text style={[styles.macroValue, { color: accent }]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    input: {
      color: p.text,
      fontSize: font.size.md,
      backgroundColor: p.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
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
    resultsCard: { marginTop: spacing.sm, paddingVertical: spacing.xs },
    resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
    resultName: { flex: 1, color: p.text, fontSize: font.size.md, marginRight: spacing.sm },
    card: { marginTop: spacing.sm, paddingVertical: spacing.xs },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.border },
    ingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
    ingName: { flex: 1, color: p.text, fontSize: font.size.md },
    gramsInput: {
      color: p.text,
      fontSize: font.size.md,
      fontFamily: font.family.uiSemibold,
      textAlign: 'right',
      minWidth: 52,
      backgroundColor: p.surfaceAlt,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    gramsUnit: { color: p.textMuted, fontSize: font.size.sm },
    totalsCard: { gap: spacing.sm, paddingVertical: spacing.md },
    totalsTitle: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiSemibold },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
    macro: { alignItems: 'center', flex: 1 },
    macroValue: { fontSize: font.size.lg, fontFamily: font.family.monoBold },
    macroLabel: { color: p.textMuted, fontSize: font.size.xs },
    totalsMeta: { color: p.textFaint, fontSize: font.size.xs },
    save: { marginTop: spacing.lg },
  });
}
