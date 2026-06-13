import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';

import { Button } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { palette, spacing, font, radius } from '../theme';
import { ZERO_NUTRITION, type Nutrition } from '../data/nutrients';
import { addCustomFood } from '../db/customFoods';
import { refreshCustomFoods } from '../data/catalog';
import type { RootStackScreenProps } from '../navigation/types';

/** Fields the user fills in, expressed *per serving* for intuitiveness. */
interface FormState {
  name: string;
  servingGrams: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  water: string;
}

const EMPTY: FormState = {
  name: '',
  servingGrams: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  sugar: '',
  water: '',
};

function num(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function AddCustomFoodScreen({ navigation }: RootStackScreenProps<'AddCustomFood'>) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const servingGrams = num(form.servingGrams);
  const valid = form.name.trim().length > 0 && servingGrams > 0;

  // Live preview of per-100g values (how data is stored).
  const per100Preview = useMemo(() => {
    if (servingGrams <= 0) return null;
    const factor = 100 / servingGrams;
    return {
      calories: Math.round(num(form.calories) * factor),
      protein: Math.round(num(form.protein) * factor * 10) / 10,
      carbs: Math.round(num(form.carbs) * factor * 10) / 10,
      fat: Math.round(num(form.fat) * factor * 10) / 10,
    };
  }, [form, servingGrams]);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const factor = 100 / servingGrams;
      const per100g: Nutrition = {
        ...ZERO_NUTRITION,
        calories: num(form.calories) * factor,
        protein: num(form.protein) * factor,
        carbs: num(form.carbs) * factor,
        fat: num(form.fat) * factor,
        fiber: num(form.fiber) * factor,
        sugar: num(form.sugar) * factor,
        water: num(form.water) * factor,
      };
      await addCustomFood({
        name: form.name.trim(),
        category: 'Custom',
        servingGrams,
        servingLabel: `1 serving (${Math.round(servingGrams)} g)`,
        per100g,
      });
      await refreshCustomFoods();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Add a food once and reuse it forever. Stored on your device — free, no account.
        </Text>

        <SectionTitle>Basics</SectionTitle>
        <Card style={styles.card}>
          <Field label="Name" value={form.name} onChange={set('name')} placeholder="e.g. Grandma's lasagna" autoFocus />
          <Divider />
          <Field
            label="Serving size"
            value={form.servingGrams}
            onChange={set('servingGrams')}
            placeholder="grams"
            unit="g"
            keyboardType="numeric"
          />
        </Card>

        <SectionTitle>Per serving</SectionTitle>
        <Card style={styles.card}>
          <Field label="Calories" value={form.calories} onChange={set('calories')} unit="kcal" keyboardType="numeric" />
          <Divider />
          <Field label="Protein" value={form.protein} onChange={set('protein')} unit="g" keyboardType="numeric" />
          <Divider />
          <Field label="Carbs" value={form.carbs} onChange={set('carbs')} unit="g" keyboardType="numeric" />
          <Divider />
          <Field label="Fat" value={form.fat} onChange={set('fat')} unit="g" keyboardType="numeric" />
          <Divider />
          <Field label="Fiber" value={form.fiber} onChange={set('fiber')} unit="g" keyboardType="numeric" />
          <Divider />
          <Field label="Sugar" value={form.sugar} onChange={set('sugar')} unit="g" keyboardType="numeric" />
          <Divider />
          <Field label="Water" value={form.water} onChange={set('water')} unit="mL" keyboardType="numeric" />
        </Card>

        {per100Preview && (
          <Text style={styles.preview}>
            Stored as {per100Preview.calories} kcal · {per100Preview.protein}P /{' '}
            {per100Preview.carbs}C / {per100Preview.fat}F per 100 g
          </Text>
        )}

        <Button label="Save food" onPress={save} disabled={!valid} loading={saving} style={styles.save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
  keyboardType?: 'default' | 'numeric';
  autoFocus?: boolean;
}

function Field({ label, value, onChange, placeholder, unit, keyboardType = 'default', autoFocus }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputWrap}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? '0'}
          placeholderTextColor={palette.textFaint}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          autoCorrect={false}
        />
        {unit ? <Text style={styles.fieldUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { color: palette.textMuted, fontSize: font.size.sm, lineHeight: 18 },
  card: { paddingVertical: spacing.xs },
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, gap: spacing.md },
  fieldLabel: { color: palette.text, fontSize: font.size.md, flex: 1 },
  fieldInputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  fieldInput: {
    color: palette.text,
    fontSize: font.size.lg,
    fontFamily: font.family.uiSemibold,
    textAlign: 'right',
    minWidth: 110,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fieldUnit: { color: palette.textMuted, fontSize: font.size.sm, width: 36 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  preview: { color: palette.textFaint, fontSize: font.size.sm, textAlign: 'center', marginTop: spacing.lg },
  save: { marginTop: spacing.lg },
});
