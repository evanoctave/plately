import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';

import { spacing, font, radius, shadow, macroColors } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../state/useSettings';
import { fmtInt } from '../utils/format';
import { kgToLb } from '../utils/goals';
import type { RootStackScreenProps } from '../navigation/types';

export function GoalResultsScreen({ navigation }: RootStackScreenProps<'GoalResults'>) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const goals = useSettings((s) => s.goals);
  const profile = useSettings((s) => s.profile);
  const weightUnit = useSettings((s) => s.weightUnit);

  const [phase, setPhase] = useState<'generating' | 'reveal'>('generating');
  const pct = useSharedValue(0);

  useEffect(() => {
    pct.value = withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) runOnJS(setPhase)('reveal');
    });
  }, []);

  const pctStyle = useAnimatedStyle(() => ({ width: `${pct.value * 100}%` }));
  const [pctNum, setPctNum] = useState(0);
  useEffect(() => {
    if (phase === 'generating') {
      const id = setInterval(() => setPctNum((p) => Math.min(100, p + 4)), 80);
      return () => clearInterval(id);
    }
  }, [phase]);

  if (phase === 'generating') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.generatingBody}>
          <Text style={styles.pctNum}>{pctNum}%</Text>
          <Text style={styles.pctTitle}>We're setting{'\n'}everything up for you</Text>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, pctStyle]} />
          </View>
          <View style={styles.checklist}>
            {['Calories', 'Carbs', 'Protein', 'Fats', 'Micronutrients'].map((label, i) => {
              const reached = pctNum >= (i + 1) * 18;
              return (
                <View key={label} style={styles.checkRow}>
                  <Text style={styles.checkText}>{label}</Text>
                  {reached
                    ? <Ionicons name="checkmark-circle" size={18} color={p.text} />
                    : <View style={styles.checkPending} />}
                </View>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentLb = profile.weightKg ? Math.round(kgToLb(profile.weightKg)) : 0;
  const targetLb = profile.targetWeightKg ? Math.round(kgToLb(profile.targetWeightKg)) : currentLb;
  const display = (lb: number) => weightUnit === 'kg' ? `${Math.round(lb / 2.20462)} kg` : `${lb} lbs`;
  const diff = currentLb - targetLb;
  const direction = profile.goalDirection ?? 'maintain';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.doneBadge}>
          <Ionicons name="checkmark-circle" size={26} color={p.accent} />
        </View>
        <Text style={styles.goalLine}>
          {direction === 'maintain'
            ? `Goal: maintain ${display(currentLb)}`
            : `Goal: ${direction === 'lose' ? 'lose' : 'gain'} ${Math.abs(diff)} ${weightUnit === 'kg' ? 'kg' : 'lbs'}`}
        </Text>

        <ProgressChart currentLb={currentLb} targetLb={targetLb} direction={direction} styles={styles} p={p} />

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Your daily recommendation</Text>
          <Text style={styles.cardSub}>You can edit this anytime</Text>

          <View style={styles.bigStat}>
            <View style={styles.bigStatIcon}>
              <Ionicons name="flame" size={20} color={p.text} />
            </View>
            <Text style={styles.bigStatNum}>{fmtInt(goals.calories)}</Text>
            <Text style={styles.bigStatLabel}>Calories</Text>
          </View>

          <View style={styles.macroRow}>
            <Macro label="Protein" v={`${fmtInt(goals.protein)}g`} color={macroColors.protein} icon="fitness" styles={styles} />
            <Macro label="Carbs" v={`${fmtInt(goals.carbs)}g`} color={macroColors.carbs} icon="leaf" styles={styles} />
            <Macro label="Fats" v={`${fmtInt(goals.fat)}g`} color={macroColors.fat} icon="water" styles={styles} />
          </View>
        </View>

        <View style={styles.howCard}>
          <Text style={styles.howHeader}>How to reach your goals</Text>
          {[
            { i: 'camera' as const, t: 'Snap or log every meal' },
            { i: 'pie-chart' as const, t: 'Balance protein, carbs, fat' },
            { i: 'flame' as const, t: 'Stay close to your daily calories' },
            { i: 'trending-up' as const, t: 'Weigh in weekly to track progress' },
          ].map((row) => (
            <View key={row.t} style={styles.howRow}>
              <View style={styles.howIcon}><Ionicons name={row.i} size={18} color={p.text} /></View>
              <Text style={styles.howText}>{row.t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel="Let's get started"
        >
          <Text style={styles.ctaText}>Let's get started!</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Macro({ label, v, color, icon, styles }: { label: string; v: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.macro}>
      <View style={[styles.macroIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={styles.macroV}>{v}</Text>
      <Text style={styles.macroL}>{label}</Text>
    </View>
  );
}

function ProgressChart({ currentLb, targetLb, direction, styles, p }: { currentLb: number; targetLb: number; direction: string; styles: ReturnType<typeof makeStyles>; p: ReturnType<typeof useTheme> }) {
  const w = 280;
  const h = 80;
  // Simple decay curve from current → target
  const top = 10;
  const bottom = h - 10;
  const startY = direction === 'gain' ? bottom : top;
  const endY = direction === 'gain' ? top : bottom;
  const path = `M 8 ${startY} C ${w * 0.4} ${startY}, ${w * 0.6} ${endY}, ${w - 16} ${endY}`;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartHeader}>Estimated progress</Text>
      <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
        <Svg width={w} height={h}>
          <Path d={path} stroke={p.text} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Circle cx={8} cy={startY} r={4} fill={p.text} />
          <Circle cx={w - 16} cy={endY} r={4} fill={p.accent} />
        </Svg>
        <View style={styles.chartLabels}>
          <Text style={styles.chartFaint}>Now</Text>
          <Text style={styles.chartFaint}>Target {targetLb} lbs</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },

    // generating
    generatingBody: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
    pctNum: { color: p.text, fontSize: 56, fontFamily: font.family.uiBold, letterSpacing: -2 },
    pctTitle: { color: p.text, fontSize: 22, fontFamily: font.family.uiBold, textAlign: 'center', lineHeight: 28 },
    track: { width: '90%', height: 4, borderRadius: 2, backgroundColor: p.surfaceAlt, marginTop: spacing.md, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: p.text, borderRadius: 2 },
    checklist: { width: '90%', backgroundColor: p.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: p.border, marginTop: spacing.lg, ...shadow.card },
    checkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    checkText: { color: p.text, fontSize: font.size.md, fontFamily: font.family.ui },
    checkPending: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: p.border },

    // results
    body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    doneBadge: { alignSelf: 'center', marginTop: spacing.lg },
    goalLine: { color: p.text, fontSize: 24, fontFamily: font.family.uiBold, textAlign: 'center', letterSpacing: -0.5, marginBottom: spacing.sm },

    chartCard: { backgroundColor: p.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card, borderWidth: StyleSheet.hairlineWidth, borderColor: p.border },
    chartHeader: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    chartLabels: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    chartFaint: { color: p.textFaint, fontSize: font.size.xs, fontFamily: font.family.uiMedium },

    card: { backgroundColor: p.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: p.border, ...shadow.card },
    cardHeader: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    cardSub: { color: p.textMuted, fontSize: font.size.xs, marginTop: -spacing.xs },
    bigStat: { backgroundColor: p.surfaceAlt, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
    bigStatIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center' },
    bigStatNum: { color: p.text, fontSize: font.size.xxl, fontFamily: font.family.uiBold, letterSpacing: -0.8 },
    bigStatLabel: { color: p.textMuted, fontSize: font.size.sm, marginTop: 8 },
    macroRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    macro: { flex: 1, backgroundColor: p.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, alignItems: 'flex-start', gap: 4 },
    macroIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    macroV: { color: p.text, fontSize: font.size.lg, fontFamily: font.family.uiBold },
    macroL: { color: p.textMuted, fontSize: font.size.xs, fontFamily: font.family.uiMedium },

    howCard: { backgroundColor: p.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: p.border, ...shadow.card },
    howHeader: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    howRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: p.surfaceAlt, padding: spacing.md, borderRadius: radius.md },
    howIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center' },
    howText: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiMedium },

    footer: { padding: spacing.lg },
    cta: { backgroundColor: p.text, borderRadius: radius.pill, paddingVertical: spacing.md + 2, alignItems: 'center' },
    ctaText: { color: p.white, fontSize: font.size.md, fontFamily: font.family.uiBold },
  });
}
