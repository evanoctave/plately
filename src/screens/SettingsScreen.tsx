import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import appConfig from '../../app.json';

import { Card, SectionTitle } from '../components/Card';
import { Button } from '../components/Button';
import { palette, spacing, font, radius } from '../theme';
import { useSettings } from '../state/useSettings';
import { useDiaryRevision } from '../state/useDiary';
import { clearAllEntries } from '../db/database';
import { isModelReady, getModelStatus, loadModel } from '../ml/recognizer';
import type { Goals } from '../data/nutrients';
import type { TabScreenProps } from '../navigation/types';

const PRIVACY_URL = 'https://github.com/evanoctave/funny-idea/blob/main/docs/PRIVACY_POLICY.md';

const GOAL_FIELDS: { key: keyof Goals; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'water', label: 'Water', unit: 'mL' },
];

export function SettingsScreen(_props: TabScreenProps<'Settings'>) {
  const { goals, setGoals, waterUnit, setWaterUnit } = useSettings();
  const bump = useDiaryRevision((s) => s.bump);
  const [modelStatus, setModelStatus] = useState(getModelStatus());

  const updateGoal = (key: keyof Goals, text: string) => {
    const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setGoals({ [key]: Number.isFinite(n) ? n : 0 } as Partial<Goals>);
  };

  const refreshModel = async () => {
    setModelStatus('loading');
    await loadModel();
    setModelStatus(getModelStatus());
  };

  const eraseAll = () => {
    Alert.alert(
      'Erase all data?',
      'This permanently deletes every logged meal and day on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllEntries();
            bump();
          },
        },
      ],
    );
  };

  const modelLabel = isModelReady()
    ? 'Ready (on-device)'
    : modelStatus === 'downloading'
      ? 'Downloading…'
      : modelStatus === 'loading'
        ? 'Loading…'
        : 'Not downloaded';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <SectionTitle>Daily goals</SectionTitle>
        <Card style={styles.card}>
          {GOAL_FIELDS.map((field, i) => (
            <View key={field.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>{field.label}</Text>
                <View style={styles.goalInputWrap}>
                  <TextInput
                    style={styles.goalInput}
                    keyboardType="number-pad"
                    defaultValue={String(goals[field.key])}
                    onChangeText={(t) => updateGoal(field.key, t)}
                    maxLength={6}
                  />
                  <Text style={styles.goalUnit}>{field.unit}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        <SectionTitle>Water unit</SectionTitle>
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            {(['ml', 'oz'] as const).map((u) => (
              <Pressable
                key={u}
                onPress={() => setWaterUnit(u)}
                style={[styles.toggle, waterUnit === u && styles.toggleActive]}
              >
                <Text style={[styles.toggleText, waterUnit === u && styles.toggleTextActive]}>
                  {u === 'ml' ? 'Milliliters (mL)' : 'Fluid ounces (oz)'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <SectionTitle>On-device AI model</SectionTitle>
        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons
              name={isModelReady() ? 'checkmark-circle' : 'cloud-download-outline'}
              size={22}
              color={isModelReady() ? palette.green : palette.textMuted}
            />
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>Food recognition</Text>
              <Text style={styles.infoMeta}>{modelLabel}</Text>
            </View>
          </View>
          <Text style={styles.note}>
            Recognition runs entirely on your device — your photos never leave your phone. The model
            downloads once over the network, then works fully offline.
          </Text>
          {!isModelReady() && (
            <Button label="Download model now" variant="secondary" onPress={() => void refreshModel()} />
          )}
        </Card>

        <SectionTitle>Privacy & data</SectionTitle>
        <Card style={styles.card}>
          <Pressable style={styles.linkRow} onPress={() => void Linking.openURL(PRIVACY_URL)}>
            <Ionicons name="shield-checkmark-outline" size={20} color={palette.text} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color={palette.textFaint} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.linkRow} onPress={eraseAll}>
            <Ionicons name="trash-outline" size={20} color={palette.red} />
            <Text style={[styles.linkText, { color: palette.red }]}>Erase all data</Text>
          </Pressable>
        </Card>

        <Text style={styles.disclaimer}>
          NutriSnap provides approximate estimates for general wellness and is not a medical device.
          It does not provide medical, dietary, or nutritional advice. Consult a qualified
          professional for health decisions.
        </Text>
        <Text style={styles.version}>
          {appConfig.expo.name} v{appConfig.expo.version}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: palette.text, fontSize: font.size.xxl, fontWeight: font.weight.bold },
  card: { paddingVertical: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  goalLabel: { color: palette.text, fontSize: font.size.md },
  goalInputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  goalInput: {
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
  goalUnit: { color: palette.textMuted, fontSize: font.size.sm, width: 36 },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  toggle: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: palette.surfaceAlt, alignItems: 'center' },
  toggleActive: { backgroundColor: palette.green },
  toggleText: { color: palette.textMuted, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  toggleTextActive: { color: palette.black },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  infoBody: { flex: 1 },
  infoTitle: { color: palette.text, fontSize: font.size.md, fontWeight: font.weight.semibold },
  infoMeta: { color: palette.textMuted, fontSize: font.size.sm },
  note: { color: palette.textFaint, fontSize: font.size.sm, lineHeight: 18, marginVertical: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  linkText: { flex: 1, color: palette.text, fontSize: font.size.md },
  disclaimer: { color: palette.textFaint, fontSize: font.size.xs, lineHeight: 16, marginTop: spacing.xl },
  version: { color: palette.textFaint, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.lg },
});
