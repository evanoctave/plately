import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing, font, radius } from '../theme';
import { usePlus } from '../state/usePlus';
import { useSettings } from '../state/useSettings';
import { useDayLog } from '../state/useDiary';
import { buildCoachTips, type CoachTone } from '../utils/coach';
import { dayKey, prettyDay } from '../utils/date';
import { PlusLock } from '../components/PlusLock';
import type { RootStackScreenProps } from '../navigation/types';

const TONE_COLOR: Record<CoachTone, string> = {
  good: palette.teal,
  warn: palette.amber,
  info: palette.blue,
};

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
  const today = dayKey();
  const goals = useSettings((s) => s.goals);
  const { entries, totals } = useDayLog(today);

  const itemCount = useMemo(() => entries.filter((e) => e.source !== 'water').length, [entries]);
  const tips = useMemo(() => buildCoachTips({ totals, goals, itemCount }), [totals, goals, itemCount]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="bulb" size={20} color={palette.accent} />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  headerText: { flex: 1 },
  title: { color: palette.text, fontSize: font.size.xxl, fontFamily: font.family.uiBold },
  sub: { color: palette.textMuted, fontSize: font.size.sm },
  tip: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  tipIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tipBody: { flex: 1, gap: 3 },
  tipTitle: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
  tipDetail: { color: palette.textMuted, fontSize: font.size.sm, lineHeight: 19 },
  footer: { color: palette.textFaint, fontSize: font.size.xs, lineHeight: 16, marginTop: spacing.sm },
});
