import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import appConfig from '../../app.json';

import { Card, SectionTitle } from '../components/Card';
import { Button } from '../components/Button';
import { palette, spacing, font, radius } from '../theme';
import { useSettings } from '../state/useSettings';
import { useDiaryRevision } from '../state/useDiary';
import { clearAllEntries } from '../db/database';
import { exportDiaryCsv } from '../utils/export';
import { isModelReady, getModelStatus, loadModel } from '../ml/recognizer';
import { useAuth } from '../auth/useAuth';
import { signOut } from '../auth/actions';
import { applyReminderSchedule } from '../notifications/notifications';
import type { Goals } from '../data/nutrients';
import type { TabScreenProps } from '../navigation/types';

const GOAL_FIELDS: { key: keyof Goals; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'water', label: 'Water', unit: 'mL' },
];

const PLUS_EXTRAS: { route: 'Fasting' | 'GoalPhases' | 'Coach' | 'MealPlanner'; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { route: 'Fasting', label: 'Fasting timer', sub: 'Track intermittent fasting windows', icon: 'timer-outline' },
  { route: 'GoalPhases', label: 'Goal phases', sub: 'Cut, maintain & bulk targets', icon: 'trending-up-outline' },
  { route: 'Coach', label: 'Smart Coach', sub: 'On-device daily guidance', icon: 'bulb-outline' },
  { route: 'MealPlanner', label: 'Meal planner', sub: 'Plan and pre-log your days', icon: 'calendar-outline' },
];

/** Things competitors commonly charge for that Plately gives away free. */
const FREE_PERKS = [
  'Photo food recognition (on-device)',
  'Create unlimited custom foods',
  'Trends, streaks & insights',
  'Export your data (CSV)',
  'No ads, no tracking · account optional',
];

export function SettingsScreen({ navigation }: TabScreenProps<'Settings'>) {
  const { goals, setGoals, waterUnit, setWaterUnit, weightUnit, setWeightUnit, accent, plusActive } = useSettings();
  const reminders = useSettings((s) => s.reminders);
  const setReminders = useSettings((s) => s.setReminders);
  const { account, signedIn } = useAuth();
  const bump = useDiaryRevision((s) => s.bump);
  const [modelStatus, setModelStatus] = useState(getModelStatus());

  // Toggle a reminder preference, then re-register the local notification set.
  const toggleReminder = (patch: Partial<typeof reminders>) => {
    const next = { ...reminders, ...patch };
    setReminders(patch);
    void applyReminderSchedule(next);
  };

  const onSignOut = () => {
    Alert.alert('Sign out?', 'Your data stays on this device. Sign back in anytime to sync.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const updateGoal = (key: keyof Goals, text: string) => {
    const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setGoals({ [key]: Number.isFinite(n) ? n : 0 } as Partial<Goals>);
  };

  const refreshModel = async () => {
    setModelStatus('loading');
    await loadModel();
    setModelStatus(getModelStatus());
  };

  const onExport = async () => {
    const result = await exportDiaryCsv();
    if (result.status === 'empty') {
      Alert.alert('Nothing to export', 'Log some meals first, then export your diary.');
    } else if (result.status === 'unavailable') {
      Alert.alert('Export unavailable', 'Sharing is not available on this device.');
    }
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

        <SectionTitle>Account</SectionTitle>
        <Card style={styles.card}>
          {signedIn ? (
            <>
              <View style={styles.linkRow}>
                <Ionicons name="person-circle-outline" size={22} color={palette.green} />
                <View style={styles.extraBody}>
                  <Text style={styles.linkText}>{account?.email ?? account?.name ?? 'Signed in'}</Text>
                  <Text style={styles.extraSub}>Synced across your devices</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <Pressable style={styles.linkRow} onPress={onSignOut}>
                <Ionicons name="log-out-outline" size={20} color={palette.red} />
                <Text style={[styles.linkText, { color: palette.red }]}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Auth', { mode: 'signin' })}>
              <Ionicons name="cloud-outline" size={20} color={palette.text} />
              <View style={styles.extraBody}>
                <Text style={styles.linkText}>Sign in or create account</Text>
                <Text style={styles.extraSub}>Back up &amp; sync your diary across devices</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
            </Pressable>
          )}
        </Card>

        <Card style={styles.freeCard}>
          <View style={styles.freeHeader}>
            <Ionicons name="heart" size={18} color={palette.green} />
            <Text style={styles.freeTitle}>Free forever — really</Text>
          </View>
          <Text style={styles.freeSub}>
            Everything other trackers lock behind a subscription, Plately gives you free:
          </Text>
          {FREE_PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={16} color={palette.green} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
          <Text style={styles.freePrice}>Core features free forever · no ads · no account</Text>
        </Card>

        <Pressable
          onPress={() => navigation.navigate('PlatelyPlus')}
          style={({ pressed }) => [styles.plusRow, { borderColor: accent }, pressed && { opacity: 0.8 }]}
        >
          <View style={[styles.plusBadge, { backgroundColor: accent }]}>
            <Ionicons name="star" size={16} color={palette.black} />
          </View>
          <View style={styles.plusBody}>
            <Text style={styles.plusTitle}>Plately+</Text>
            <Text style={styles.plusSub}>Fasting, goal phases, Smart Coach, meal planner & more</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
        </Pressable>

        <SectionTitle>Plately+ extras</SectionTitle>
        <Card style={styles.card}>
          {PLUS_EXTRAS.map((extra, i) => (
            <View key={extra.route}>
              {i > 0 && <View style={styles.divider} />}
              <Pressable style={styles.linkRow} onPress={() => navigation.navigate(extra.route)}>
                <Ionicons name={extra.icon} size={20} color={plusActive ? accent : palette.textMuted} />
                <View style={styles.extraBody}>
                  <Text style={styles.linkText}>{extra.label}</Text>
                  <Text style={styles.extraSub}>{extra.sub}</Text>
                </View>
                {!plusActive && <Ionicons name="lock-closed" size={15} color={palette.textFaint} />}
                <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
              </Pressable>
            </View>
          ))}
        </Card>

        <SectionTitle>Personalize</SectionTitle>
        <Card style={styles.card}>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Achievements')}>
            <Ionicons name="trophy-outline" size={20} color={palette.text} />
            <Text style={styles.linkText}>Achievements</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Appearance')}>
            <Ionicons name="color-palette-outline" size={20} color={palette.text} />
            <Text style={styles.linkText}>Appearance</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Weight')}>
            <Ionicons name="scale-outline" size={20} color={palette.text} />
            <Text style={styles.linkText}>Weight tracking</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
          </Pressable>
        </Card>

        <SectionTitle>Daily goals</SectionTitle>
        <Pressable
          onPress={() => navigation.navigate('GoalCalculator')}
          style={({ pressed }) => [styles.calcRow, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="calculator-outline" size={20} color={palette.green} />
          <View style={styles.calcBody}>
            <Text style={styles.calcTitle}>Calculate my goals</Text>
            <Text style={styles.calcSub}>Personalize from your body metrics</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
        </Pressable>
        <Card style={styles.card}>
          {GOAL_FIELDS.map((field, i) => (
            <View key={field.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>{field.label}</Text>
                <View style={styles.goalInputWrap}>
                  <TextInput
                    key={`${field.key}-${goals[field.key]}`}
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

        <SectionTitle>Weight unit</SectionTitle>
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            {(['kg', 'lb'] as const).map((u) => (
              <Pressable
                key={u}
                onPress={() => setWeightUnit(u)}
                style={[styles.toggle, weightUnit === u && styles.toggleActive]}
              >
                <Text style={[styles.toggleText, weightUnit === u && styles.toggleTextActive]}>
                  {u === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)'}
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

        <SectionTitle>Reminders</SectionTitle>
        <Card style={styles.card}>
          <View style={styles.linkRow}>
            <Ionicons name="notifications-outline" size={20} color={palette.text} />
            <View style={styles.extraBody}>
              <Text style={styles.linkText}>Daily reminders</Text>
              <Text style={styles.extraSub}>Gentle nudges to log meals &amp; water</Text>
            </View>
            <Pressable
              onPress={() => toggleReminder({ enabled: !reminders.enabled })}
              style={[styles.switch, reminders.enabled && { backgroundColor: accent }]}
              accessibilityRole="switch"
              accessibilityState={{ checked: reminders.enabled }}
            >
              <View style={[styles.knob, reminders.enabled && styles.knobOn]} />
            </Pressable>
          </View>
          {reminders.enabled && (
            <>
              {([
                ['meals', 'Meal reminders', 'Breakfast, lunch & dinner'],
                ['water', 'Water reminder', 'Mid-afternoon hydration nudge'],
                ['streak', 'Streak reminder', 'Evening "keep your streak" nudge'],
              ] as const).map(([key, label, sub]) => (
                <View key={key}>
                  <View style={styles.divider} />
                  <View style={styles.linkRow}>
                    <View style={{ width: 20 }} />
                    <View style={styles.extraBody}>
                      <Text style={styles.linkText}>{label}</Text>
                      <Text style={styles.extraSub}>{sub}</Text>
                    </View>
                    <Pressable
                      onPress={() => toggleReminder({ [key]: !reminders[key] } as Partial<typeof reminders>)}
                      style={[styles.switch, reminders[key] && { backgroundColor: accent }]}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: reminders[key] }}
                    >
                      <View style={[styles.knob, reminders[key] && styles.knobOn]} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}
        </Card>

        <SectionTitle>Your data</SectionTitle>
        <Card style={styles.card}>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('RecipeBuilder')}>
            <Ionicons name="create-outline" size={20} color={palette.text} />
            <Text style={styles.linkText}>Create a recipe</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('MyFoods')}>
            <Ionicons name="restaurant-outline" size={20} color={palette.text} />
            <Text style={styles.linkText}>My custom foods</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.linkRow} onPress={() => void onExport()}>
            <Ionicons name="download-outline" size={20} color={palette.text} />
            <Text style={styles.linkText}>Export diary (CSV)</Text>
            <Ionicons name="share-outline" size={18} color={palette.textFaint} />
          </Pressable>
        </Card>

        <SectionTitle>Privacy &amp; data</SectionTitle>
        <Card style={styles.card}>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Ionicons name="shield-checkmark-outline" size={20} color={palette.text} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.linkRow} onPress={eraseAll}>
            <Ionicons name="trash-outline" size={20} color={palette.red} />
            <Text style={[styles.linkText, { color: palette.red }]}>Erase all data</Text>
          </Pressable>
        </Card>

        <Text style={styles.disclaimer}>
          Plately provides approximate estimates for general wellness and is not a medical device.
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
  title: { color: palette.text, fontSize: font.size.xxl, fontFamily: font.family.uiBold },
  freeCard: { gap: spacing.xs, marginTop: spacing.lg, borderColor: palette.greenDark, borderWidth: 1 },
  freeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  freeTitle: { color: palette.text, fontSize: font.size.lg, fontFamily: font.family.uiBold },
  freeSub: { color: palette.textMuted, fontSize: font.size.sm, marginBottom: spacing.xs, lineHeight: 18 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  perkText: { color: palette.text, fontSize: font.size.md },
  freePrice: { color: palette.green, fontSize: font.size.sm, fontFamily: font.family.uiSemibold, marginTop: spacing.sm },
  plusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  plusBadge: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  plusBody: { flex: 1, gap: 2 },
  plusTitle: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiBold },
  plusSub: { color: palette.textMuted, fontSize: font.size.sm, lineHeight: 17 },
  card: { paddingVertical: spacing.xs },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  calcBody: { flex: 1, gap: 2 },
  calcTitle: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
  calcSub: { color: palette.textMuted, fontSize: font.size.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  goalLabel: { color: palette.text, fontSize: font.size.md },
  goalInputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  goalInput: {
    color: palette.text,
    fontSize: font.size.lg,
    fontFamily: font.family.uiSemibold,
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
  toggleText: { color: palette.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiSemibold },
  toggleTextActive: { color: palette.black },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  infoBody: { flex: 1 },
  infoTitle: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
  infoMeta: { color: palette.textMuted, fontSize: font.size.sm },
  note: { color: palette.textFaint, fontSize: font.size.sm, lineHeight: 18, marginVertical: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  linkText: { flex: 1, color: palette.text, fontSize: font.size.md },
  extraBody: { flex: 1 },
  extraSub: { color: palette.textMuted, fontSize: font.size.sm, marginTop: 1 },
  switch: { width: 44, height: 26, borderRadius: radius.pill, backgroundColor: palette.border, padding: 3, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: radius.pill, backgroundColor: palette.white },
  knobOn: { alignSelf: 'flex-end' },
  disclaimer: { color: palette.textFaint, fontSize: font.size.xs, lineHeight: 16, marginTop: spacing.xl },
  version: { color: palette.textFaint, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.lg },
});
