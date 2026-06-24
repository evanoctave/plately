import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { format } from 'date-fns';

import { Card, SectionTitle } from '../components/Card';
import { Button } from '../components/Button';
import { PlusLock } from '../components/PlusLock';
import { spacing, font, radius } from '../theme';
import { useSettings } from '../state/useSettings';
import { usePlus } from '../state/usePlus';
import { useFastingData } from '../state/useFasting';
import {
  FAST_PROTOCOLS,
  computeFastStreak,
  elapsedHours,
  fastProgress,
  formatCountdown,
  formatHoursLabel,
} from '../utils/fasting';
import type { FastSession } from '../db/fasting';
import type { RootStackScreenProps } from '../navigation/types';

const RING_SIZE = 240;
const STROKE = 16;

export function FastingScreen({ navigation }: RootStackScreenProps<'Fasting'>) {
  const { active } = usePlus();
  if (!active) {
    return (
      <PlusLock
        icon="timer"
        title="Fasting timer"
        description="Track your intermittent fasting windows with a live countdown, protocols and streaks — all on your device."
        highlights={[
          '16:8, 18:6, 20:4, OMAD or a custom window',
          'Live countdown while you fast',
          'Fasting streaks and history',
        ]}
        onSeePlus={() => navigation.navigate('PlatelyPlus')}
      />
    );
  }
  return <FastingTimer />;
}

function FastingTimer() {
  const p = useTheme();
  const accent = useSettings((s) => s.accent);
  const { active, recent, start, stop, remove } = useFastingData();

  const [selected, setSelected] = useState(FAST_PROTOCOLS[0]!);
  const [now, setNow] = useState(Date.now());

  // Tick once a second while a fast is running.
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const streak = useMemo(() => computeFastStreak(recent), [recent]);
  const styles = useMemo(() => makeStyles(p), [p]);

  const onStart = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void start(selected.fastHours);
  };

  const onStop = () => {
    const reached = active ? elapsedHours(active, now) >= active.targetHours : false;
    Alert.alert(
      reached ? 'End your fast?' : 'End fast early?',
      reached
        ? 'Nice work — you hit your target window.'
        : "You haven't reached your target window yet. End anyway?",
      [
        { text: 'Keep fasting', style: 'cancel' },
        {
          text: 'End fast',
          style: reached ? 'default' : 'destructive',
          onPress: () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            void stop();
          },
        },
      ],
    );
  };

  const confirmDelete = (s: FastSession) => {
    Alert.alert('Delete this fast?', 'Remove it from your history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove(s.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {streak > 0 && (
          <View style={[styles.streakPill, { borderColor: accent }]}>
            <Ionicons name="flame" size={15} color={accent} />
            <Text style={[styles.streakText, { color: accent }]}>
              {streak}-day fasting streak
            </Text>
          </View>
        )}

        {active ? (
          <ActiveFast session={active} now={now} accent={accent} onStop={onStop} />
        ) : (
          <View style={styles.idle}>
            <FastRing progress={0} centerTop="Ready" centerMain="Start a fast" accent={p.textFaint} idle />
            <SectionTitle>Choose a protocol</SectionTitle>
            <View style={styles.protocolGrid}>
              {FAST_PROTOCOLS.map((p) => {
                const on = p.key === selected.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setSelected(p)}
                    style={[styles.protocol, on && { borderColor: accent, backgroundColor: accent + '1A' }]}
                  >
                    <Text style={[styles.protocolLabel, on && { color: accent }]}>{p.label}</Text>
                    <Text style={styles.protocolBlurb}>{p.blurb}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button label={`Start ${selected.label} fast`} onPress={onStart} />
          </View>
        )}

        {recent.length > 0 && (
          <>
            <SectionTitle>History</SectionTitle>
            <Card style={styles.historyCard}>
              {recent.map((s, i) => {
                const hrs = elapsedHours(s);
                const reached = hrs >= s.targetHours;
                return (
                  <View key={s.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <Pressable style={styles.historyRow} onLongPress={() => confirmDelete(s)}>
                      <View style={[styles.historyIcon, { backgroundColor: reached ? accent + '22' : p.surfaceAlt }]}>
                        <Ionicons
                          name={reached ? 'checkmark' : 'time-outline'}
                          size={18}
                          color={reached ? accent : p.textMuted}
                        />
                      </View>
                      <View style={styles.historyBody}>
                        <Text style={styles.historyDur}>{formatHoursLabel(hrs)}</Text>
                        <Text style={styles.historyMeta}>
                          {format(new Date(s.startedAt), 'EEE, MMM d · h:mm a')} · {s.targetHours}h goal
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
              <Text style={styles.historyHint}>Long-press a fast to delete it.</Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActiveFast({
  session,
  now,
  accent,
  onStop,
}: {
  session: FastSession;
  now: number;
  accent: string;
  onStop: () => void;
}) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const hrs = elapsedHours(session, now);
  const progress = fastProgress(session, now);
  const remaining = Math.max(0, session.targetHours - hrs);
  const reached = hrs >= session.targetHours;

  return (
    <View style={styles.active}>
      <FastRing
        progress={progress}
        centerTop={reached ? 'Target reached' : 'Remaining'}
        centerMain={reached ? formatHoursLabel(hrs) : formatCountdown(remaining)}
        accent={reached ? accent : accent}
      />
      <Text style={styles.activeMeta}>
        {formatHoursLabel(hrs)} elapsed of {session.targetHours}h · started{' '}
        {format(new Date(session.startedAt), 'h:mm a')}
      </Text>
      <Button
        label={reached ? 'Complete fast' : 'End fast'}
        variant={reached ? 'primary' : 'danger'}
        onPress={onStop}
      />
    </View>
  );
}

function FastRing({
  progress,
  centerTop,
  centerMain,
  accent,
  idle,
}: {
  progress: number;
  centerTop: string;
  centerMain: string;
  accent: string;
  idle?: boolean;
}) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const r = (RING_SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r} stroke={p.surfaceAlt} strokeWidth={STROKE} fill="none" />
        {!idle && (
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={r}
            stroke={accent}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            fill="none"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        )}
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        <Text style={styles.ringTop}>{centerTop}</Text>
        <Text style={[styles.ringMain, idle && styles.ringMainIdle]}>{centerMain}</Text>
        {!idle && (
          <Text style={styles.ringPct}>{Math.round(Math.max(0, Math.min(1, progress)) * 100)}%</Text>
        )}
      </View>
    </View>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md, alignItems: 'center' },
    streakPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
    },
    streakText: { fontSize: font.size.sm, fontFamily: font.family.uiSemibold },
    idle: { alignItems: 'center', gap: spacing.md, alignSelf: 'stretch' },
    active: { alignItems: 'center', gap: spacing.lg, alignSelf: 'stretch', marginTop: spacing.sm },
    activeMeta: { color: p.textMuted, fontSize: font.size.sm, textAlign: 'center' },
    protocolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignSelf: 'stretch' },
    protocol: {
      width: '47%',
      flexGrow: 1,
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: p.border,
      padding: spacing.md,
      gap: 2,
    },
    protocolLabel: { color: p.text, fontSize: font.size.lg, fontFamily: font.family.monoBold },
    protocolBlurb: { color: p.textMuted, fontSize: font.size.sm },
    ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    ringTop: { color: p.textFaint, fontSize: font.size.xs, textTransform: 'uppercase', letterSpacing: 1 },
    ringMain: { color: p.text, fontSize: 34, fontFamily: font.family.monoBold, marginTop: 4, letterSpacing: -0.5 },
    ringMainIdle: { fontSize: font.size.xl, fontFamily: font.family.uiBold },
    ringPct: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.mono, marginTop: 2 },
    historyCard: { alignSelf: 'stretch', paddingVertical: spacing.xs },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    historyIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    historyBody: { flex: 1 },
    historyDur: { color: p.text, fontSize: font.size.md, fontFamily: font.family.monoSemibold },
    historyMeta: { color: p.textMuted, fontSize: font.size.sm, marginTop: 1 },
    historyHint: { color: p.textFaint, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.sm },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.border },
  });
}
