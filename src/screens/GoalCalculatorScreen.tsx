import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';

import { Button } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { palette, spacing, font, radius, macroColors } from '../theme';
import { useSettings } from '../state/useSettings';
import { fmtInt } from '../utils/format';
import {
  computeGoals,
  feetInchesToCm,
  lbToKg,
  ACTIVITY_LABELS,
  DIRECTION_LABELS,
  type Sex,
  type ActivityLevel,
  type GoalDirection,
} from '../utils/goals';
import type { RootStackScreenProps } from '../navigation/types';

type UnitSystem = 'metric' | 'imperial';

const ACTIVITIES = Object.keys(ACTIVITY_LABELS) as ActivityLevel[];
const DIRECTIONS = Object.keys(DIRECTION_LABELS) as GoalDirection[];

function num(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function GoalCalculatorScreen({ navigation }: RootStackScreenProps<'GoalCalculator'>) {
  const setGoals = useSettings((s) => s.setGoals);

  const [units, setUnits] = useState<UnitSystem>('imperial');
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [direction, setDirection] = useState<GoalDirection>('maintain');

  const weightKg = units === 'metric' ? num(weight) : lbToKg(num(weight));
  const resolvedHeightCm = units === 'metric' ? num(heightCm) : feetInchesToCm(num(feet), num(inches));
  const ageYears = num(age);

  const valid = weightKg > 0 && resolvedHeightCm > 0 && ageYears > 0;

  const preview = useMemo(() => {
    if (!valid) return null;
    return computeGoals({
      sex,
      age: ageYears,
      heightCm: resolvedHeightCm,
      weightKg,
      activity,
      direction,
    });
  }, [valid, sex, ageYears, resolvedHeightCm, weightKg, activity, direction]);

  const apply = () => {
    if (!preview) return;
    setGoals(preview);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Estimate daily calorie and macro targets from your body metrics. General wellness math —
          you can fine-tune the numbers afterward.
        </Text>

        <Segmented
          options={[
            { key: 'imperial', label: 'lb / ft' },
            { key: 'metric', label: 'kg / cm' },
          ]}
          value={units}
          onChange={(v) => setUnits(v as UnitSystem)}
        />

        <SectionTitle>About you</SectionTitle>
        <Card style={styles.card}>
          <Row label="Sex">
            <Segmented
              compact
              options={[
                { key: 'male', label: 'Male' },
                { key: 'female', label: 'Female' },
              ]}
              value={sex}
              onChange={(v) => setSex(v as Sex)}
            />
          </Row>
          <Divider />
          <InputRow label="Age" value={age} onChange={setAge} unit="yr" />
          <Divider />
          {units === 'metric' ? (
            <InputRow label="Height" value={heightCm} onChange={setHeightCm} unit="cm" />
          ) : (
            <Row label="Height">
              <View style={styles.heightImperial}>
                <SmallInput value={feet} onChange={setFeet} unit="ft" />
                <SmallInput value={inches} onChange={setInches} unit="in" />
              </View>
            </Row>
          )}
          <Divider />
          <InputRow
            label="Weight"
            value={weight}
            onChange={setWeight}
            unit={units === 'metric' ? 'kg' : 'lb'}
          />
        </Card>

        <SectionTitle>Activity</SectionTitle>
        <Card style={styles.listCard}>
          {ACTIVITIES.map((a, i) => (
            <Option
              key={a}
              label={ACTIVITY_LABELS[a]}
              selected={activity === a}
              first={i === 0}
              onPress={() => setActivity(a)}
            />
          ))}
        </Card>

        <SectionTitle>Goal</SectionTitle>
        <Card style={styles.listCard}>
          {DIRECTIONS.map((d, i) => (
            <Option
              key={d}
              label={DIRECTION_LABELS[d]}
              selected={direction === d}
              first={i === 0}
              onPress={() => setDirection(d)}
            />
          ))}
        </Card>

        {preview && (
          <Card style={styles.previewCard}>
            <Text style={styles.previewTitle}>Your targets</Text>
            <View style={styles.previewCalRow}>
              <Text style={styles.previewCal}>{fmtInt(preview.calories)}</Text>
              <Text style={styles.previewCalUnit}>kcal / day</Text>
            </View>
            <View style={styles.previewMacros}>
              <Macro label="Protein" value={preview.protein} color={macroColors.protein} />
              <Macro label="Carbs" value={preview.carbs} color={macroColors.carbs} />
              <Macro label="Fat" value={preview.fat} color={macroColors.fat} />
            </View>
            <Text style={styles.previewWater}>💧 {fmtInt(preview.water)} mL water / day</Text>
          </Card>
        )}

        <Button label="Use these goals" onPress={apply} disabled={!valid} style={styles.apply} />
        {!valid && <Text style={styles.hint}>Enter age, height and weight to calculate.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InputRow({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <Row label={label}>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={palette.textFaint}
          maxLength={5}
        />
        <Text style={styles.inputUnit}>{unit}</Text>
      </View>
    </Row>
  );
}

function SmallInput({ value, onChange, unit }: { value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <View style={styles.inputWrap}>
      <TextInput
        style={styles.smallInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={palette.textFaint}
        maxLength={2}
      />
      <Text style={styles.inputUnit}>{unit}</Text>
    </View>
  );
}

interface SegOption {
  key: string;
  label: string;
}

function Segmented({ options, value, onChange, compact }: { options: SegOption[]; value: string; onChange: (v: string) => void; compact?: boolean }) {
  return (
    <View style={[styles.segmented, compact && styles.segmentedCompact]}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[styles.segment, value === o.key && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, value === o.key && styles.segmentTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Option({ label, selected, first, onPress }: { label: string; selected: boolean; first: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, !first && styles.optionBorder, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{label}</Text>
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macro}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroValue}>{value} g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  intro: { color: palette.textMuted, fontSize: font.size.sm, lineHeight: 18, marginBottom: spacing.sm },
  card: { paddingVertical: spacing.xs },
  listCard: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md },
  rowLabel: { color: palette.text, fontSize: font.size.md },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: {
    color: palette.text,
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    textAlign: 'right',
    minWidth: 70,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  smallInput: {
    color: palette.text,
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    textAlign: 'right',
    minWidth: 44,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  inputUnit: { color: palette.textMuted, fontSize: font.size.sm, width: 24 },
  heightImperial: { flexDirection: 'row', gap: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginHorizontal: spacing.lg },
  segmented: { flexDirection: 'row', gap: spacing.xs, backgroundColor: palette.surfaceAlt, borderRadius: radius.md, padding: 3 },
  segmentedCompact: { alignSelf: 'flex-end' },
  segment: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: palette.green },
  segmentText: { color: palette.textMuted, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  segmentTextActive: { color: palette.black },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  optionBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  optionText: { color: palette.textMuted, fontSize: font.size.md, flex: 1 },
  optionTextActive: { color: palette.text, fontWeight: font.weight.semibold },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: palette.green },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.green },
  previewCard: { marginTop: spacing.lg, gap: spacing.sm, borderColor: palette.greenDark, borderWidth: 1 },
  previewTitle: { color: palette.textMuted, fontSize: font.size.sm, fontWeight: font.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  previewCalRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  previewCal: { color: palette.text, fontSize: font.size.display, fontWeight: font.weight.bold },
  previewCalUnit: { color: palette.textMuted, fontSize: font.size.md },
  previewMacros: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
  macro: { alignItems: 'center', gap: 4 },
  macroDot: { width: 10, height: 10, borderRadius: 5 },
  macroValue: { color: palette.text, fontSize: font.size.lg, fontWeight: font.weight.semibold },
  macroLabel: { color: palette.textMuted, fontSize: font.size.sm },
  previewWater: { color: palette.water, fontSize: font.size.sm, fontWeight: font.weight.medium, marginTop: spacing.sm },
  apply: { marginTop: spacing.lg },
  hint: { color: palette.textFaint, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.sm },
});
