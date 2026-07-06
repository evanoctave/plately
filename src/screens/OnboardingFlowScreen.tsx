import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, useWindowDimensions,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';

import { spacing, font, radius, shadow } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../state/useSettings';
import {
  DIRECTION_LABELS, computeGoals, feetInchesToCm, lbToKg,
  type Sex, type ActivityLevel, type GoalDirection,
} from '../utils/goals';
import type { RootStackScreenProps } from '../navigation/types';

type SexChoice = Sex | 'other';

const WORKOUT_BUCKETS = [
  { label: '0–2', subtitle: 'Workouts now and then', value: 0 as const, activity: 'light' as ActivityLevel },
  { label: '3–5', subtitle: 'A few workouts per week', value: 1 as const, activity: 'moderate' as ActivityLevel },
  { label: '6+', subtitle: 'Dedicated athlete', value: 2 as const, activity: 'intense' as ActivityLevel },
];

const DIETS = ['Balanced', 'Whole-food focus', 'Mediterranean', 'Pescatarian', 'Vegetarian', 'Vegan', 'Low-carb', 'Keto', 'Paleo'];

const OBSTACLES = [
  { id: 'consistency', label: 'Lack of consistency', icon: 'stats-chart' as const },
  { id: 'habits', label: 'Unhealthy eating habits', icon: 'fast-food' as const },
  { id: 'support', label: 'Lack of support', icon: 'people' as const },
  { id: 'busy', label: 'Busy schedule', icon: 'calendar' as const },
  { id: 'inspiration', label: 'Lack of meal inspiration', icon: 'bulb' as const },
];

const REFERRAL = ['Facebook', 'X', 'TikTok', 'Instagram', 'App Store', 'YouTube', 'Google', 'Friend'];

const SOURCE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Facebook: 'logo-facebook',
  X: 'logo-twitter',
  TikTok: 'logo-tiktok',
  Instagram: 'logo-instagram',
  'App Store': 'logo-apple-appstore',
  YouTube: 'logo-youtube',
  Google: 'logo-google',
  Friend: 'people',
};

type StepId =
  | 'sex' | 'workouts' | 'tried' | 'birth' | 'height' | 'weight'
  | 'goal' | 'target' | 'speed' | 'trainer' | 'diet'
  | 'obstacles' | 'referral' | 'notifications';

const STEPS: StepId[] = [
  'sex', 'workouts', 'tried', 'birth', 'height', 'weight',
  'goal', 'target', 'speed', 'trainer', 'diet',
  'obstacles', 'referral', 'notifications',
];

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
    progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: p.surfaceAlt, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: p.text, borderRadius: 2 },

    body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
    qTitle: { color: p.text, fontSize: 26, fontFamily: font.family.uiBold, letterSpacing: -0.6, lineHeight: 32 },
    qSub: { color: p.textMuted, fontSize: font.size.md, fontFamily: font.family.ui },
    bigNum: { color: p.text, fontSize: font.size.xxl, fontFamily: font.family.uiBold, letterSpacing: -1 },

    choice: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
      borderRadius: radius.lg, backgroundColor: p.surface,
      borderWidth: 1.5, borderColor: p.border,
      ...shadow.card,
    },
    choiceSelected: { borderColor: p.text },
    choiceLabel: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    choiceSub: { color: p.textMuted, fontSize: font.size.xs, fontFamily: font.family.ui, marginTop: 1 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: p.border, alignItems: 'center', justifyContent: 'center' },
    radioOn: { borderColor: p.text, backgroundColor: p.text },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: p.surface },

    unitToggle: { flexDirection: 'row', alignSelf: 'center', backgroundColor: p.surfaceAlt, borderRadius: radius.pill, padding: 4 },
    unitOpt: { paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: radius.pill },
    unitOptOn: { backgroundColor: p.surface, ...shadow.card },
    unitTxt: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiSemibold },
    unitTxtOn: { color: p.text },

    pickerRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },

    speedChip: {
      flex: 1, alignItems: 'center', gap: 6,
      paddingVertical: spacing.md, borderRadius: radius.lg,
      backgroundColor: p.surface, borderWidth: 1.5, borderColor: p.border,
    },
    speedChipOn: { borderColor: p.text },
    speedTxt: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiSemibold },

    // Wheel picker
    wheelRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', alignItems: 'center' },
    wheelItem: { height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center' },
    wheelText: { color: p.textFaint, fontSize: 22, fontFamily: font.family.uiSemibold },
    wheelTextOn: { color: p.text, fontFamily: font.family.uiBold },
    wheelMask: {
      position: 'absolute', left: 0, right: 0, height: WHEEL_ITEM_H,
      borderTopWidth: 1, borderBottomWidth: 1, borderColor: p.border,
    },

    // Ruler slider
    rulerValue: { color: p.text, fontSize: 40, fontFamily: font.family.uiBold, letterSpacing: -1, textAlign: 'center' },
    rulerUnit: { color: p.textMuted, fontSize: font.size.lg, fontFamily: font.family.uiSemibold },
    rulerWrap: { height: 56, position: 'relative' },
    rulerIndicator: {
      position: 'absolute', top: 2, left: '50%', width: 2, height: 36,
      backgroundColor: p.text, marginLeft: -1, borderRadius: 1,
    },

    notifPreview: {
      backgroundColor: p.surfaceAlt, padding: spacing.lg, borderRadius: radius.lg, gap: spacing.md,
    },
    notifTitle: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold, textAlign: 'center' },
    notifBtnRow: { flexDirection: 'row', gap: spacing.sm },
    notifBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center', backgroundColor: p.surface },
    notifBtnPrimary: { backgroundColor: p.text },
    notifBtnText: { color: p.text, fontFamily: font.family.uiSemibold },

    footer: { padding: spacing.lg, paddingBottom: spacing.xl },
    cta: {
      backgroundColor: p.text, borderRadius: radius.pill,
      paddingVertical: spacing.md + 2, alignItems: 'center',
    },
    ctaDisabled: { opacity: 0.35 },
    ctaText: { color: p.white, fontSize: font.size.md, fontFamily: font.family.uiBold },
  });
}

type Styles = ReturnType<typeof makeStyles>;

export function OnboardingFlowScreen({ navigation }: RootStackScreenProps<'OnboardingFlow'>) {
  const p = useTheme();
  const updateProfile = useSettings((s) => s.updateProfile);
  const setGoals = useSettings((s) => s.setGoals);

  const [idx, setIdx] = useState(0);
  const stepId = STEPS[idx];

  // local working profile
  const [sex, setSex] = useState<SexChoice>('male');
  const [workouts, setWorkouts] = useState<0 | 1 | 2>(1);
  const [tried, setTried] = useState<boolean | null>(null);
  const [birthMonth, setBirthMonth] = useState(9);
  const [birthDay, setBirthDay] = useState(15);
  const [birthYear, setBirthYear] = useState(2000);
  const [unitH, setUnitH] = useState<'ft' | 'cm'>('ft');
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(9);
  const [heightCmInput, setHeightCmInput] = useState(175);
  const [unitW, setUnitW] = useState<'lb' | 'kg'>('lb');
  const [weightLb, setWeightLb] = useState(165);
  const [weightKg, setWeightKg] = useState(75);
  const [goalDir, setGoalDir] = useState<GoalDirection>('maintain');
  const [targetLb, setTargetLb] = useState(150);
  const [targetKg, setTargetKg] = useState(68);
  const [speed, setSpeed] = useState(1);            // 0 slow, 1 recommended, 2 fast
  const [hasTrainer, setHasTrainer] = useState<boolean | null>(null);
  const [diet, setDiet] = useState<string | null>(null);
  const [obstacles, setObstacles] = useState<string[]>([]);
  const [referral, setReferral] = useState<string | null>(null);

  const styles = useMemo(() => makeStyles(p), [p]);

  const totalSteps = STEPS.length;
  const progress = (idx + 1) / totalSteps;

  const canContinue = useMemo(() => {
    switch (stepId) {
      case 'tried': return tried !== null;
      case 'trainer': return hasTrainer !== null;
      case 'diet': return diet !== null;
      case 'referral': return referral !== null;
      default: return true;
    }
  }, [stepId, tried, hasTrainer, diet, referral]);

  const finish = useCallback(() => {
    const heightCm = unitH === 'cm' ? heightCmInput : feetInchesToCm(feet, inches);
    const wKg = unitW === 'kg' ? weightKg : lbToKg(weightLb);
    const tKg = unitW === 'kg' ? targetKg : lbToKg(targetLb);
    const age = new Date().getFullYear() - birthYear;
    const activity = (WORKOUT_BUCKETS[workouts]?.activity ?? 'moderate') as ActivityLevel;
    const sexForGoals: Sex = sex === 'other' ? 'male' : sex;

    const computed = computeGoals({
      sex: sexForGoals, age, heightCm, weightKg: wKg, activity, direction: goalDir,
    });

    updateProfile({
      sex,
      birthYear,
      heightCm,
      weightKg: wKg,
      targetWeightKg: goalDir === 'maintain' ? wKg : tKg,
      activity,
      workoutsPerWeek: workouts,
      goalDirection: goalDir,
      speedLbsPerWeek: [0.5, 1, 1.7][speed],
      hasTrainer: hasTrainer ?? false,
      diet: diet ?? undefined,
      obstacles,
      referralSource: referral ?? undefined,
      triedOtherApps: tried ?? false,
      notificationsEnabled: true,
    });
    setGoals(computed);
    navigation.replace('GoalResults');
  }, [
    unitH, unitW, heightCmInput, feet, inches, weightKg, weightLb, targetKg, targetLb,
    birthYear, workouts, sex, goalDir, speed, hasTrainer, diet, obstacles, referral, tried,
    updateProfile, setGoals, navigation,
  ]);

  const next = () => {
    if (idx >= totalSteps - 1) {
      finish();
    } else {
      setIdx(idx + 1);
    }
  };

  const back = () => {
    if (idx === 0) navigation.goBack();
    else setIdx(idx - 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color={p.text} />
          </Pressable>
          <ProgressBar styles={styles} progress={progress} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {stepId === 'sex' && (
            <Question title="Choose your sex" subtitle="This helps personalize your experience." styles={styles}>
              <ChoiceList
                styles={styles}
                iconColor={p.text}
                value={sex}
                onChange={(v) => setSex(v as SexChoice)}
                options={[
                  { value: 'male', label: 'Male', icon: 'male' },
                  { value: 'female', label: 'Female', icon: 'female' },
                  { value: 'other', label: 'Other', icon: 'apps' },
                ]}
              />
            </Question>
          )}

          {stepId === 'workouts' && (
            <Question title="How many workouts do you do per week?" subtitle="Used to calibrate your custom plan." styles={styles}>
              <ChoiceList
                styles={styles}
                iconColor={p.text}
                value={String(workouts)}
                onChange={(v) => setWorkouts(Number(v) as 0 | 1 | 2)}
                options={WORKOUT_BUCKETS.map((b, i) => ({
                  value: String(i), label: b.label, sub: b.subtitle, icon: 'fitness',
                }))}
              />
            </Question>
          )}

          {stepId === 'tried' && (
            <Question title="Have you tried other calorie tracking apps?" styles={styles}>
              <YesNo styles={styles} iconColor={p.text} value={tried} onChange={setTried} />
            </Question>
          )}

          {stepId === 'birth' && (
            <Question title="When were you born?" subtitle="Taken into account when calculating your goals." styles={styles}>
              <BirthWheel
                styles={styles}
                month={birthMonth} day={birthDay} year={birthYear}
                onChange={(m, d, y) => { setBirthMonth(m); setBirthDay(d); setBirthYear(y); }}
              />
            </Question>
          )}

          {stepId === 'height' && (
            <Question title="What is your height?" subtitle="Taken into account when calculating your goals." styles={styles}>
              <UnitToggle styles={styles} a="ft, in" b="cm" value={unitH === 'ft' ? 'a' : 'b'} onChange={(v) => setUnitH(v === 'a' ? 'ft' : 'cm')} />
              {unitH === 'ft' ? (
                <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'center' }}>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={styles.unitTxt}>ft</Text>
                    <WheelPicker styles={styles} items={Array.from({ length: 6 }, (_, i) => i + 3)} value={feet} onChange={setFeet} />
                  </View>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={styles.unitTxt}>in</Text>
                    <WheelPicker styles={styles} items={Array.from({ length: 12 }, (_, i) => i)} value={inches} onChange={setInches} />
                  </View>
                </View>
              ) : (
                <RulerSlider styles={styles} textMuted={p.textMuted} textFaint={p.textFaint} value={heightCmInput} onChange={setHeightCmInput} min={120} max={220} unit="cm" />
              )}
            </Question>
          )}

          {stepId === 'weight' && (
            <Question title="What is your weight?" subtitle="Taken into account when calculating your goals." styles={styles}>
              <UnitToggle styles={styles} a="lbs" b="kg" value={unitW === 'lb' ? 'a' : 'b'} onChange={(v) => setUnitW(v === 'a' ? 'lb' : 'kg')} />
              {unitW === 'lb'
                ? <RulerSlider styles={styles} textMuted={p.textMuted} textFaint={p.textFaint} value={weightLb} onChange={setWeightLb} min={60} max={400} unit="lbs" />
                : <RulerSlider styles={styles} textMuted={p.textMuted} textFaint={p.textFaint} value={weightKg} onChange={setWeightKg} min={27} max={180} unit="kg" />}
            </Question>
          )}

          {stepId === 'goal' && (
            <Question title="What is your goal?" subtitle="This helps us generate a plan for your calorie intake." styles={styles}>
              <ChoiceList
                styles={styles}
                iconColor={p.text}
                value={goalDir}
                onChange={(v) => setGoalDir(v as GoalDirection)}
                options={[
                  { value: 'lose', label: DIRECTION_LABELS.lose, icon: 'arrow-down' },
                  { value: 'maintain', label: DIRECTION_LABELS.maintain, icon: 'remove' },
                  { value: 'gain', label: DIRECTION_LABELS.gain, icon: 'arrow-up' },
                ]}
              />
            </Question>
          )}

          {stepId === 'target' && goalDir !== 'maintain' && (
            <Question title="What is your desired weight?" styles={styles}>
              <UnitToggle styles={styles} a="lbs" b="kg" value={unitW === 'lb' ? 'a' : 'b'} onChange={(v) => setUnitW(v === 'a' ? 'lb' : 'kg')} />
              {unitW === 'lb'
                ? <RulerSlider styles={styles} textMuted={p.textMuted} textFaint={p.textFaint} value={targetLb} onChange={setTargetLb} min={60} max={400} unit="lbs" />
                : <RulerSlider styles={styles} textMuted={p.textMuted} textFaint={p.textFaint} value={targetKg} onChange={setTargetKg} min={27} max={180} unit="kg" />}
            </Question>
          )}
          {stepId === 'target' && goalDir === 'maintain' && (
            <Question title="Your target is your current weight" subtitle="Skip ahead — you're set to maintain." styles={styles} />
          )}

          {stepId === 'speed' && (
            <Question title="How fast do you want to reach your goal?" styles={styles}>
              <SpeedSlider styles={styles} textColor={p.text} textMuted={p.textMuted} value={speed} onChange={setSpeed} direction={goalDir} />
            </Question>
          )}

          {stepId === 'trainer' && (
            <Question title="Do you currently work with a personal trainer or registered dietitian?" styles={styles}>
              <YesNo styles={styles} iconColor={p.text} value={hasTrainer} onChange={setHasTrainer} />
            </Question>
          )}

          {stepId === 'diet' && (
            <Question title="Do you follow a specific diet?" styles={styles}>
              <ChoiceList
                styles={styles}
                iconColor={p.text}
                value={diet ?? ''}
                onChange={(v) => setDiet(typeof v === 'string' ? v : v[0] ?? null)}
                options={DIETS.map((d) => ({ value: d, label: d, icon: 'restaurant' }))}
              />
            </Question>
          )}

          {stepId === 'obstacles' && (
            <Question title="What's stopping you from reaching your goals?" subtitle="Select all that apply." styles={styles}>
              <ChoiceList
                styles={styles}
                iconColor={p.text}
                multi
                value={obstacles}
                onChange={(v) => setObstacles(v as string[])}
                options={OBSTACLES.map((o) => ({ value: o.id, label: o.label, icon: o.icon }))}
              />
            </Question>
          )}

          {stepId === 'referral' && (
            <Question title="Where did you hear about us?" styles={styles}>
              <ChoiceList
                styles={styles}
                iconColor={p.text}
                value={referral ?? ''}
                onChange={(v) => setReferral(typeof v === 'string' ? v : v[0] ?? null)}
                options={REFERRAL.map((r) => ({ value: r, label: r, icon: SOURCE_ICONS[r] ?? 'apps' }))}
              />
            </Question>
          )}

          {stepId === 'notifications' && (
            <Question title="Stay on track with Plately notifications" subtitle="We'll remind you to log meals and check in on your streak." styles={styles}>
              <View style={styles.notifPreview}>
                <Text style={styles.notifTitle}>Plately would like to send you Notifications</Text>
                <View style={styles.notifBtnRow}>
                  <View style={styles.notifBtn}><Text style={styles.notifBtnText}>Don't Allow</Text></View>
                  <View style={[styles.notifBtn, styles.notifBtnPrimary]}><Text style={[styles.notifBtnText, { color: p.white }]}>Allow</Text></View>
                </View>
              </View>
            </Question>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={!canContinue}
            onPress={next}
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* — Shared UI pieces — */

function ProgressBar({ progress, styles }: { progress: number; styles: Styles }) {
  const width = useSharedValue(progress);
  width.value = withTiming(progress, { duration: 350, easing: Easing.out(Easing.cubic) });
  const aStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, aStyle]} />
    </View>
  );
}

function Question({ title, subtitle, children, styles }: { title: string; subtitle?: string; children?: React.ReactNode; styles: Styles }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: 6 }}>
        <Text style={styles.qTitle}>{title}</Text>
        {subtitle && <Text style={styles.qSub}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );
}

interface ChoiceOpt { value: string; label: string; sub?: string; icon?: keyof typeof Ionicons.glyphMap }

function ChoiceList({
  value, onChange, options, multi = false, styles, iconColor,
}: {
  value: string | string[];
  onChange: (v: string | string[]) => void;
  options: ChoiceOpt[];
  multi?: boolean;
  styles: Styles;
  iconColor: string;
}) {
  const isSelected = (v: string) => multi
    ? Array.isArray(value) && value.includes(v)
    : value === v;

  const toggle = (v: string) => {
    if (multi) {
      const cur = Array.isArray(value) ? value : [];
      onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
    } else {
      onChange(v);
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((opt) => {
        const selected = isSelected(opt.value);
        return (
          <Pressable
            key={opt.value}
            onPress={() => toggle(opt.value)}
            style={[styles.choice, selected && styles.choiceSelected]}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: selected, selected }}
            accessibilityLabel={opt.label}
          >
            {opt.icon && <Ionicons name={opt.icon} size={20} color={iconColor} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.choiceLabel}>{opt.label}</Text>
              {opt.sub && <Text style={styles.choiceSub}>{opt.sub}</Text>}
            </View>
            <View style={[styles.radio, selected && styles.radioOn]}>
              {selected && <View style={styles.radioDot} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function YesNo({ value, onChange, styles, iconColor }: { value: boolean | null; onChange: (v: boolean) => void; styles: Styles; iconColor: string }) {
  return (
    <ChoiceList
      styles={styles}
      iconColor={iconColor}
      value={value === null ? '' : value ? 'yes' : 'no'}
      onChange={(v) => onChange(v === 'yes')}
      options={[
        { value: 'yes', label: 'Yes', icon: 'thumbs-up' },
        { value: 'no', label: 'No', icon: 'thumbs-down' },
      ]}
    />
  );
}

function UnitToggle({ a, b, value, onChange, styles }: { a: string; b: string; value: 'a' | 'b'; onChange: (v: 'a' | 'b') => void; styles: Styles }) {
  return (
    <View style={styles.unitToggle}>
      <Pressable onPress={() => onChange('a')} style={[styles.unitOpt, value === 'a' && styles.unitOptOn]}>
        <Text style={[styles.unitTxt, value === 'a' && styles.unitTxtOn]}>{a}</Text>
      </Pressable>
      <Pressable onPress={() => onChange('b')} style={[styles.unitOpt, value === 'b' && styles.unitOptOn]}>
        <Text style={[styles.unitTxt, value === 'b' && styles.unitTxtOn]}>{b}</Text>
      </Pressable>
    </View>
  );
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function BirthWheel({ month, day, year, onChange, styles }: { month: number; day: number; year: number; onChange: (m: number, d: number, y: number) => void; styles: Styles }) {
  const currentYear = new Date().getFullYear();
  const minYear = 1925;
  const maxYear = currentYear - 13;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View style={styles.wheelRow}>
      <View style={{ flex: 1.2 }}>
        <WheelPicker
          styles={styles}
          items={months}
          value={month}
          onChange={(m) => onChange(m, Math.min(day, new Date(year, m, 0).getDate()), year)}
          format={(m) => MONTH_NAMES[m - 1] ?? ''}
        />
      </View>
      <View style={{ flex: 0.8 }}>
        <WheelPicker styles={styles} items={days} value={Math.min(day, daysInMonth)} onChange={(d) => onChange(month, d, year)} />
      </View>
      <View style={{ flex: 1 }}>
        <WheelPicker
          styles={styles}
          items={years}
          value={year}
          onChange={(y) => onChange(month, Math.min(day, new Date(y, month, 0).getDate()), y)}
        />
      </View>
    </View>
  );
}

const WHEEL_ITEM_H = 40;
const WHEEL_VISIBLE = 5;

function WheelPicker<T>({
  items, value, onChange, format, styles,
}: {
  items: T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
  styles: Styles;
}) {
  const idx = Math.max(0, items.indexOf(value));
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Snap to the active item without animation on first render and on value changes.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: idx * WHEEL_ITEM_H, animated: false });
    });
  }, [idx]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.y;
    const i = Math.round(offset / WHEEL_ITEM_H);
    const next = items[Math.max(0, Math.min(items.length - 1, i))];
    if (next !== undefined && next !== value) onChange(next);
  };

  return (
    <View style={{ height: WHEEL_ITEM_H * WHEEL_VISIBLE, overflow: 'hidden' }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingVertical: WHEEL_ITEM_H * 2 }}
      >
        {items.map((item, i) => {
          const selected = i === idx;
          return (
            <View key={i} style={styles.wheelItem}>
              <Text style={[styles.wheelText, selected && styles.wheelTextOn]}>
                {format ? format(item) : String(item)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={[styles.wheelMask, { top: WHEEL_ITEM_H * 2 }]} />
    </View>
  );
}

function RulerSlider({
  value, onChange, min, max, unit, styles, textMuted, textFaint,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
  styles: Styles;
  textMuted: string;
  textFaint: string;
}) {
  const TICK_W = 8;
  const { width: screenW } = useWindowDimensions();
  const padding = Math.floor(screenW / 2) - spacing.lg;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: (value - min) * TICK_W, animated: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only, scroll position is user-driven after
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const v = Math.round(offset / TICK_W) + min;
    const clamped = Math.max(min, Math.min(max, v));
    if (clamped !== value) onChange(clamped);
  };

  const count = max - min + 1;

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={styles.rulerValue}>
        {value}<Text style={styles.rulerUnit}> {unit}</Text>
      </Text>
      <View style={styles.rulerWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_W}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={32}
          contentContainerStyle={{ paddingHorizontal: padding }}
        >
          {Array.from({ length: count }).map((_, i) => {
            const v = min + i;
            const major = v % 10 === 0;
            return (
              <View key={i} style={{ width: TICK_W, alignItems: 'center', justifyContent: 'flex-end', height: 52 }}>
                <View style={{ width: 1, height: major ? 24 : 12, backgroundColor: major ? textMuted : textFaint }} />
              </View>
            );
          })}
        </ScrollView>
        <View pointerEvents="none" style={styles.rulerIndicator} />
      </View>
    </View>
  );
}

function SpeedSlider({ value, onChange, direction, styles, textColor, textMuted }: { value: number; onChange: (n: number) => void; direction: GoalDirection; styles: Styles; textColor: string; textMuted: string }) {
  const lbsLabels = direction === 'lose' ? ['-0.5', '-1.0', '-1.7'] : direction === 'gain' ? ['0.5', '1.0', '1.7'] : ['0.0', '0.0', '0.0'];
  const speed = ['Slow', 'Recommended', 'Fast'];
  const icons: (keyof typeof Ionicons.glyphMap)[] = ['walk', 'speedometer', 'flash'];
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={styles.qSub}>Weight {direction === 'gain' ? 'gain' : 'change'} per week</Text>
        <Text style={styles.bigNum}>{lbsLabels[value]} lbs</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {speed.map((s, i) => (
          <Pressable
            key={s}
            onPress={() => onChange(i)}
            style={[styles.speedChip, value === i && styles.speedChipOn]}
          >
            <Ionicons name={icons[i]} size={20} color={value === i ? textColor : textMuted} />
            <Text style={[styles.speedTxt, value === i && { color: textColor }]}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
