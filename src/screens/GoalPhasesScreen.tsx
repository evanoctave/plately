import { useCallback, useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { Card, SectionTitle } from '../components/Card';
import { Button } from '../components/Button';
import { PlusLock } from '../components/PlusLock';
import { spacing, font, radius } from '../theme';
import { useSettings } from '../state/useSettings';
import { usePlus } from '../state/usePlus';
import { useDiaryRevision } from '../state/useDiary';
import {
  addPhase,
  deletePhase,
  listPhases,
  setActivePhase,
  type GoalPhase,
  type PhaseKind,
} from '../db/phases';
import { PHASE_KINDS, buildPhaseGoals, phaseMeta } from '../utils/phases';
import { fmtInt } from '../utils/format';
import type { Goals } from '../data/nutrients';
import type { RootStackScreenProps } from '../navigation/types';

export function GoalPhasesScreen({ navigation }: RootStackScreenProps<'GoalPhases'>) {
  const { active } = usePlus();
  if (!active) {
    return (
      <PlusLock
        icon="trending-up"
        title="Goal phases"
        description="Plan cut, maintain and bulk phases. Activate one and your daily macro targets update across the whole app."
        highlights={[
          'Cut, maintain and bulk presets',
          'Targets derived from your maintenance goals',
          'Switch phases in a single tap',
        ]}
        onSeePlus={() => navigation.navigate('PlatelyPlus')}
      />
    );
  }
  return <GoalPhases />;
}

function GoalPhases() {
  const p = useTheme();
  const accent = useSettings((s) => s.accent);
  const baseGoals = useSettings((s) => s.goals);
  const setGoals = useSettings((s) => s.setGoals);
  const bump = useDiaryRevision((s) => s.bump);
  const styles = useMemo(() => makeStyles(p), [p]);

  const [phases, setPhases] = useState<GoalPhase[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<PhaseKind>('cut');

  const load = useCallback(async () => {
    setPhases(await listPhases());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const preview: Goals = buildPhaseGoals(baseGoals, kind);

  const resetForm = () => {
    setCreating(false);
    setName('');
    setKind('cut');
  };

  const onSave = async () => {
    const meta = phaseMeta(kind);
    const finalName = name.trim() || `${meta.label} phase`;
    await addPhase({ name: finalName, kind, goals: preview });
    resetForm();
    await load();
  };

  const onActivate = async (phase: GoalPhase) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const goingActive = phase.active !== 1;
    await setActivePhase(goingActive ? phase.id : null);
    if (goingActive) {
      setGoals({
        calories: phase.calories,
        protein: phase.protein,
        carbs: phase.carbs,
        fat: phase.fat,
        water: phase.water,
      });
    }
    bump();
    await load();
  };

  const confirmDelete = (phase: GoalPhase) => {
    Alert.alert('Delete phase?', `Remove "${phase.name}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePhase(phase.id);
          await load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Activate a phase and its targets replace your daily goals everywhere — rings, macros and
          insights. Switch back any time.
        </Text>

        {phases.length === 0 && !creating && (
          <Card style={styles.empty}>
            <Ionicons name="trending-up" size={30} color={p.textFaint} />
            <Text style={styles.emptyText}>No phases yet. Create your first cut, maintain or bulk.</Text>
          </Card>
        )}

        {phases.map((phase) => {
          const meta = phaseMeta(phase.kind);
          const isActive = phase.active === 1;
          return (
            <Card key={phase.id} style={[styles.phaseCard, isActive && { borderColor: accent }]}>
              <View style={styles.phaseHeader}>
                <View style={[styles.kindChip, { backgroundColor: accent + '1A' }]}>
                  <Ionicons name={meta.icon as never} size={13} color={accent} />
                  <Text style={[styles.kindChipText, { color: accent }]}>{meta.label}</Text>
                </View>
                <Text style={styles.phaseName}>{phase.name}</Text>
                {isActive && (
                  <View style={[styles.activeTag, { backgroundColor: accent }]}>
                    <Text style={styles.activeTagText}>ACTIVE</Text>
                  </View>
                )}
              </View>

              <View style={styles.macroRow}>
                <Macro label="kcal" value={phase.calories} />
                <Macro label="P" value={phase.protein} suffix="g" />
                <Macro label="C" value={phase.carbs} suffix="g" />
                <Macro label="F" value={phase.fat} suffix="g" />
              </View>

              <View style={styles.phaseActions}>
                <Button
                  label={isActive ? 'Deactivate' : 'Activate'}
                  variant={isActive ? 'secondary' : 'primary'}
                  onPress={() => void onActivate(phase)}
                  style={styles.flex}
                />
                <Pressable
                  onPress={() => confirmDelete(phase)}
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
                  accessibilityLabel={`Delete ${phase.name}`}
                >
                  <Ionicons name="trash-outline" size={20} color={p.red} />
                </Pressable>
              </View>
            </Card>
          );
        })}

        {creating ? (
          <Card style={styles.createCard}>
            <SectionTitle>New phase</SectionTitle>
            <TextInput
              style={styles.nameInput}
              placeholder="Phase name (e.g. Summer cut)"
              placeholderTextColor={p.textFaint}
              value={name}
              onChangeText={setName}
              maxLength={30}
            />
            <View style={styles.kindRow}>
              {PHASE_KINDS.map((m) => {
                const on = m.kind === kind;
                return (
                  <Pressable
                    key={m.kind}
                    onPress={() => setKind(m.kind)}
                    style={[styles.kindOption, on && { borderColor: accent, backgroundColor: accent + '1A' }]}
                  >
                    <Ionicons name={m.icon as never} size={18} color={on ? accent : p.textMuted} />
                    <Text style={[styles.kindOptionText, on && { color: accent }]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.kindBlurb}>{phaseMeta(kind).blurb}</Text>

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Targets from your maintenance goals</Text>
              <View style={styles.macroRow}>
                <Macro label="kcal" value={preview.calories} />
                <Macro label="P" value={preview.protein} suffix="g" />
                <Macro label="C" value={preview.carbs} suffix="g" />
                <Macro label="F" value={preview.fat} suffix="g" />
              </View>
            </View>

            <View style={styles.phaseActions}>
              <Button label="Cancel" variant="ghost" onPress={resetForm} style={styles.flex} />
              <Button label="Save phase" onPress={() => void onSave()} style={styles.flex} />
            </View>
          </Card>
        ) : (
          <Button label="Create a phase" onPress={() => setCreating(true)} style={styles.addBtn} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  return (
    <View style={styles.macro}>
      <Text style={styles.macroValue}>
        {fmtInt(value)}
        {suffix ? <Text style={styles.macroSuffix}>{suffix}</Text> : null}
      </Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    intro: { color: p.textMuted, fontSize: font.size.sm, lineHeight: 19 },
    empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
    emptyText: { color: p.textMuted, fontSize: font.size.md, textAlign: 'center' },
    phaseCard: { gap: spacing.md },
    phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    kindChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
    kindChipText: { fontSize: font.size.xs, fontFamily: font.family.uiBold, letterSpacing: 0.5 },
    phaseName: { flex: 1, color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    activeTag: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
    activeTagText: { color: p.white, fontSize: 9, fontFamily: font.family.uiBold, letterSpacing: 1 },
    macroRow: { flexDirection: 'row', gap: spacing.sm },
    macro: {
      flex: 1,
      backgroundColor: p.surfaceAlt,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      gap: 2,
    },
    macroValue: { color: p.text, fontSize: font.size.md, fontFamily: font.family.monoBold },
    macroSuffix: { color: p.textMuted, fontSize: font.size.xs, fontFamily: font.family.mono },
    macroLabel: { color: p.textFaint, fontSize: font.size.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    phaseActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    flex: { flex: 1 },
    deleteBtn: {
      width: 52,
      height: 52,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.surfaceAlt,
    },
    addBtn: { marginTop: spacing.xs },
    createCard: { gap: spacing.md },
    nameInput: {
      color: p.text,
      fontSize: font.size.md,
      backgroundColor: p.surfaceAlt,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    kindRow: { flexDirection: 'row', gap: spacing.sm },
    kindOption: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
    },
    kindOptionText: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiSemibold },
    kindBlurb: { color: p.textMuted, fontSize: font.size.sm, marginTop: -spacing.xs },
    previewBox: { backgroundColor: p.bg, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
    previewLabel: { color: p.textFaint, fontSize: font.size.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  });
}
