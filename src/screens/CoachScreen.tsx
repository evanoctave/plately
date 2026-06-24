import { useMemo } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, font, radius } from '../theme';
import { usePlus } from '../state/usePlus';
import { useSettings } from '../state/useSettings';
import { useDayLog } from '../state/useDiary';
import { buildCoachTips, type CoachTone } from '../utils/coach';
import { dayKey, prettyDay } from '../utils/date';
import { PlusLock } from '../components/PlusLock';
import type { RootStackScreenProps } from '../navigation/types';

export function CoachScreen({ navigation }: RootStackScreenProps<'Coach'>) {
  const { active } = usePlus();
  if (!active) {
    return (
      <PlusLock
        icon="bulb"
        title="Smart Coach"
        description="Daily, on-device guidance that reads your log and points out gaps and wins — no cloud, no account."
        highlights={[
          'Protein, hydration, sugar and balance tips',
          'Updates as you log through the day',
          'Runs entirely on your device',
        ]}
        onSeePlus={() => navigation.navigate('PlatelyPlus')}
      />
    );
  }
  return <Coach />;
}

function Coach() {
  const p = useTheme();
  const today = dayKey();
  const goals = useSettings((s) => s.goals);
  const { entries, totals } = useDayLog(today);

  const itemCount = useMemo(() => entries.filter((e) => e.source !== 'water').length, [entries]);
  const tips = useMemo(() => buildCoachTips({ totals, goals, itemCount }), [totals, goals, itemCount]);
  const styles = useMemo(() => makeStyles(p), [p]);
  const TONE_COLOR: Record<CoachTone, string> = {
    good: p.teal,
    warn: p.amber,
    info: p.blue,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="bulb" size={20} color={p.accent} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Your Coach</Text>
            <Text style={styles.sub}>{prettyDay(today)} · {tips.length} {tips.length === 1 ? 'note' : 'notes'}</Text>
          </View>
        </View>

        {tips.map((tip) => {
          const color = TONE_COLOR[tip.tone];
          return (
            <View key={tip.id} style={styles.tip}>
              <View style={[styles.tipIcon, { backgroundColor: color + '22' }]}>
                <Ionicons name={tip.icon as never} size={20} color={color} />
              </View>
              <View style={styles.tipBody}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDetail}>{tip.detail}</Text>
              </View>
            </View>
          );
        })}

        <Text style={styles.footer}>
          Coach reads only today's diary on your device. It offers general wellness suggestions, not
          medical or dietary advice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
    headerText: { flex: 1 },
    title: { color: p.text, fontSize: font.size.xxl, fontFamily: font.family.uiBold },
    sub: { color: p.textMuted, fontSize: font.size.sm },
    tip: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    tipIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    tipBody: { flex: 1, gap: 3 },
    tipTitle: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    tipDetail: { color: p.textMuted, fontSize: font.size.sm, lineHeight: 19 },
    footer: { color: p.textFaint, fontSize: font.size.xs, lineHeight: 16, marginTop: spacing.sm },
  });
}
