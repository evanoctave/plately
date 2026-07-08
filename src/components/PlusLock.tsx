// =============================================================================
// PlusLock — Paywall for EvoEat+ features
// =============================================================================
// Drop-in screen-level fallback rendered by any Plus-only screen when the
// user hasn't unlocked EvoEat+. Shows the feature icon, a short pitch, and
// a CTA that routes to the PlatelyPlusScreen for purchase / unlock. Usage:
//
//   if (!plusActive) return <PlusLock icon="hourglass" title="Fasting" ... />;

import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './Button';
import { spacing, font, radius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../state/useSettings';

interface PlusLockProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  /** Bullet highlights of what the feature does. */
  highlights: string[];
  /** Open the EvoEat+ screen. */
  onSeePlus: () => void;
}

/** Full-screen paywall shown when a EvoEat+ feature is opened without entitlement. */
export function PlusLock({ icon, title, description, highlights, onSeePlus }: PlusLockProps) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const accent = useSettings((s) => s.accent);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
          <Ionicons name={icon} size={36} color={accent} />
          <View style={[styles.lockBadge, { backgroundColor: accent }]}>
            <Ionicons name="lock-closed" size={12} color={p.white} />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.highlights}>
          {highlights.map((h) => (
            <View key={h} style={styles.highlightRow}>
              <Ionicons name="checkmark-circle" size={18} color={accent} />
              <Text style={styles.highlightText}>{h}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.badge, { borderColor: accent }]}>
          <Ionicons name="star" size={13} color={accent} />
          <Text style={[styles.badgeText, { color: accent }]}>PLATELY+</Text>
        </View>

        <Button label="See EvoEat+" onPress={onSeePlus} style={styles.cta} />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    lockBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 26,
      height: 26,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: p.bg,
    },
    title: { color: p.text, fontSize: font.size.xl, fontFamily: font.family.uiBold, textAlign: 'center' },
    description: {
      color: p.textMuted,
      fontSize: font.size.md,
      lineHeight: 21,
      textAlign: 'center',
      paddingHorizontal: spacing.sm,
    },
    highlights: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
    highlightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    highlightText: { color: p.text, fontSize: font.size.md, flex: 1 },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      marginTop: spacing.sm,
    },
    badgeText: { fontSize: font.size.xs, fontFamily: font.family.uiBold, letterSpacing: 1 },
    cta: { alignSelf: 'stretch', marginTop: spacing.xs },
  });
}
