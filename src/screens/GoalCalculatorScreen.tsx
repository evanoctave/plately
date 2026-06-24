import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';

import { Button } from '../components/Button';
import { Card, SectionTitle } from '../components/Card';
import { spacing, font, radius, macroColors } from '../theme';
import { useTheme } from '../theme/ThemeContext';
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

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: p.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
    intro: { color: p.textMuted, fontSize: font.size.sm, lineHeight: 18, marginBottom: spacing.sm },
    card: { paddingVertical: spacing.xs },
    listCard: { padding: 0, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md },
    rowLabel: { color: p.text, fontSize: font.size.md },
    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    input: {
      color: p.text,
      fontSize: font.size.lg,
      fontFamily: font.family.uiSemibold,
      textAlign: 'right',
      minWidth: 70,
      backgroundColor: p.surfaceAlt,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    smallInput: {
      color: p.text,
      fontSize: font.size.lg,
      fontFamily: font.family.uiSemibold,
      textAlign: 'right',
      minWidth: 44,
      backgroundColor: p.surfaceAlt,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    inputUnit: { color: p.textMuted, fontSize: font.size.sm, width: 24 },
    heightImperial: { flexDirection: 'row', gap: spacing.sm },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.border, marginHorizontal: spacing.lg },
    segmented: { flexDirection: 'row', gap: spacing.xs, backgroundColor: p.surfaceAlt, borderRadius: radius.md, padding: 3 },
    segmentedCompact: { alignSelf: 'flex-end' },
    segment: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
    segmentActive: { backgroundColor: p.green },
    segmentText: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiSemibold },
    segmentTextActive: { color: p.black },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    optionBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.border },
    optionText: { color: p.textMuted, fontSize: font.size.md, flex: 1 },
    optionTextActive: { color: p.text, fontFamily: font.family.uiSemibold },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: p.border, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: p.green },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: p.green },
    previewCard: { marginTop: spacing.lg, gap: spacing.sm, borderColor: p.greenDark, borderWidth: 1 },
    previewTitle: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiSemibold, textTransform: 'uppercase', letterSpacing: 0.6 },
    previewCalRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
    previewCal: { color: p.text, fontSize: font.size.display, fontFamily: font.family.monoBold },
    previewCalUnit: { color: p.textMuted, fontSize: font.size.md },
    previewMacros: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
    macro: { alignItems: 'center', gap: 4 },
    macroDot: { width: 10, height: 10, borderRadius: 5 },
    macroValue: { color: p.text, fontSize: font.size.lg, fontFamily: font.family.monoSemibold },
    macroLabel: { color: p.textMuted, fontSize: font.size.sm },
    previewWater: { color: p.water, fontSize: font.size.sm, fontFamily: font.family.mono, marginTop: spacing.sm },
    apply: { marginTop: spacing.lg },
    hint: { color: p.textFaint, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.sm },
  });
}

type Styles = ReturnType<typeof makeStyles>;

export function GoalCalculatorScreen({ navigation }: RootStackScreenProps<'GoalCalculator'>) {
  const p = useTheme();
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

  const styles = useMemo(() => makeStyles(p), [p]);

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
          styles={styles}
          options={[
            { key: 'imperial', label: 'lb / ft' },
            { key: 'metric', label: 'kg / cm' },
          ]}
          value={units}
          onChange={(v) => setUnits(v as UnitSystem)}
        />

        <SectionTitle>About you</SectionTitle>
        <Card style={styles.card}>
          <Row label="Sex" styles={styles}>
            <Segmented
              styles={styles}
              compact
              options={[
                { key: 'male', label: 'Male' },
                { key: 'female', label: 'Female' },
              ]}
              value={sex}
              onChange={(v) => setSex(v as Sex)}
            />
          </Row>
          <Divider styles={styles} />
          <InputRow label="Age" value={age} onChange={setAge} unit="yr" styles={styles} textFaint={p.textFaint} />
          <Divider styles={styles} />
          {units === 'metric' ? (
            <InputRow label="Height" value={heightCm} onChange={setHeightCm} unit="cm" styles={styles} textFaint={p.textFaint} />
          ) : (
            <Row label="Height" styles={styles}>
              <View style={styles.heightImperial}>
                <SmallInput value={feet} onChange={setFeet} unit="ft" styles={styles} textFaint={p.textFaint} />
                <SmallInput value={inches} onChange={setInches} unit="in" styles={styles} textFaint={p.textFaint} />
              </View>
            </Row>
          )}
          <Divider styles={styles} />
          <InputRow
            label="Weight"
            value={weight}
            onChange={setWeight}
            unit={units === 'metric' ? 'kg' : 'lb'}
            styles={styles}
            textFaint={p.textFaint}
          />
        </Card>

        <SectionTitle>Activity</SectionTitle>
        <Card style={styles.listCard}>
          {ACTIVITIES.map((a, i) => (
            <Option
              key={a}
              styles={styles}
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
              styles={styles}
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
              <Macro styles={styles} label="Protein" value={preview.protein} color={macroColors.protein} />
              <Macro styles={styles} label="Carbs" value={preview.carbs} color={macroColors.carbs} />
              <Macro styles={styles} label="Fat" value={preview.fat} color={macroColors.fat} />
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

function Row({ label, children, styles }: { label: string; children: React.ReactNode; styles: Styles }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InputRow({ label, value, onChange, unit, styles, textFaint }: { label: string; value: string; onChange: (v: string) => void; unit: string; styles: Styles; textFaint: string }) {
  return (
    <Row label={label} styles={styles}>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={textFaint}
          maxLength={5}
        />
        <Text style={styles.inputUnit}>{unit}</Text>
      </View>
    </Row>
  );
}

function SmallInput({ value, onChange, unit, styles, textFaint }: { value: string; onChange: (v: string) => void; unit: string; styles: Styles; textFaint: string }) {
  return (
    <View style={styles.inputWrap}>
      <TextInput
        style={styles.smallInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={textFaint}
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

function Segmented({ options, value, onChange, compact, styles }: { options: SegOption[]; value: string; onChange: (v: string) => void; compact?: boolean; styles: Styles }) {
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

function Option({ label, selected, first, onPress, styles }: { label: string; selected: boolean; first: boolean; onPress: () => void; styles: Styles }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, !first && styles.optionBorder, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{label}</Text>
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

function Macro({ label, value, color, styles }: { label: string; value: number; color: string; styles: Styles }) {
  return (
    <View style={styles.macro}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroValue}>{value} g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function Divider({ styles }: { styles: Styles }) {
  return <View style={styles.divider} />;
}
