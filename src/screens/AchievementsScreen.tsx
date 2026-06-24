import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '../components/Card';
import { spacing, font, radius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../state/useSettings';
import { useDiaryRevision } from '../state/useDiary';
import { getAllEntries, getLoggedDays } from '../db/database';
import { getCustomFoods } from '../db/customFoods';
import { computeStreak } from '../utils/stats';
import {
  computeAchievements,
  longestStreak,
  freezeTokens,
  type AchievementProgress,
  type AchievementStats,
} from '../data/achievements';

const EMPTY_STATS: AchievementStats = {
  totalEntries: 0,
  loggedDaysCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  customFoodsCount: 0,
  waterGoalDays: 0,
};

export function AchievementsScreen() {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const accent = useSettings((s) => s.accent);
  const waterGoal = useSettings((s) => s.goals.water);
  const revision = useDiaryRevision((s) => s.revision);
  const [stats, setStats] = useState<AchievementStats>(EMPTY_STATS);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [entries, days, customs] = await Promise.all([
        getAllEntries(),
        getLoggedDays(365),
        getCustomFoods(),
      ]);

      const waterByDay = new Map<string, number>();
      for (const e of entries) {
        if (e.water > 0) waterByDay.set(e.day, (waterByDay.get(e.day) ?? 0) + e.water);
      }
      let waterGoalDays = 0;
      for (const total of waterByDay.values()) {
        if (waterGoal > 0 && total >= waterGoal) waterGoalDays += 1;
      }

      const next: AchievementStats = {
        totalEntries: entries.length,
        loggedDaysCount: days.length,
        currentStreak: computeStreak(days),
        longestStreak: longestStreak(days),
        customFoodsCount: customs.length,
        waterGoalDays,
      };
      if (alive) setStats(next);
    })();
    return () => {
      alive = false;
    };
  }, [revision, waterGoal]);

  const progress = computeAchievements(stats);
  const unlockedCount = progress.filter((p) => p.unlocked).length;
  const freezes = freezeTokens(stats.longestStreak);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statRow}>
          <StatTile icon="trophy" value={`${unlockedCount}/${progress.length}`} label="Unlocked" accent={accent} styles={styles} />
          <StatTile icon="flame" value={String(stats.currentStreak)} label="Day streak" accent={accent} styles={styles} />
          <StatTile icon="snow" value={String(freezes)} label="Streak freezes" accent={accent} styles={styles} />
        </View>

        {progress.map((a) => (
          <Badge key={a.id} a={a} accent={accent} styles={styles} p={p} />
        ))}

        <Text style={styles.footnote}>
          Every badge is earned from data on your device. No account, no leaderboards selling your
          info — just your own progress.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  icon,
  value,
  label,
  accent,
  styles,
}: {
  icon: string;
  value: string;
  label: string;
  accent: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Card style={styles.statTile}>
      <Ionicons name={icon as never} size={20} color={accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function Badge({ a, accent, styles, p }: { a: AchievementProgress; accent: string; styles: ReturnType<typeof makeStyles>; p: ReturnType<typeof useTheme> }) {
  return (
    <Card style={[styles.badge, !a.unlocked && styles.badgeLocked]}>
      <View style={[styles.iconWrap, { backgroundColor: a.unlocked ? accent : p.surfaceAlt }]}>
        <Ionicons
          name={(a.unlocked ? a.icon : 'lock-closed') as never}
          size={22}
          color={a.unlocked ? p.black : p.textFaint}
        />
      </View>
      <View style={styles.badgeBody}>
        <Text style={[styles.badgeTitle, !a.unlocked && styles.dim]}>{a.title}</Text>
        <Text style={styles.badgeDesc}>{a.description}</Text>
        {!a.unlocked && (
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${a.pct * 100}%`, backgroundColor: accent }]} />
          </View>
        )}
      </View>
      {!a.unlocked && (
        <Text style={styles.progressText}>
          {Math.min(a.current, a.goal)}/{a.goal}
        </Text>
      )}
      {a.unlocked && <Ionicons name="checkmark-circle" size={22} color={accent} />}
    </Card>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
    statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    statTile: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md },
    statValue: { color: p.text, fontSize: font.size.xl, fontFamily: font.family.monoBold },
    statLabel: { color: p.textMuted, fontSize: font.size.xs, textAlign: 'center' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    badgeLocked: { opacity: 0.92 },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeBody: { flex: 1, gap: 2 },
    badgeTitle: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    dim: { color: p.textMuted },
    badgeDesc: { color: p.textMuted, fontSize: font.size.sm },
    barTrack: {
      height: 5,
      borderRadius: radius.pill,
      backgroundColor: p.surfaceAlt,
      overflow: 'hidden',
      marginTop: spacing.xs,
    },
    barFill: { height: 5, borderRadius: radius.pill },
    progressText: { color: p.textFaint, fontSize: font.size.xs, fontFamily: font.family.monoSemibold },
    footnote: { color: p.textFaint, fontSize: font.size.xs, lineHeight: 16, marginTop: spacing.md },
  });
}
