import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { palette, spacing, font, radius } from '../theme';
import { useSettings } from '../state/useSettings';

interface PlusFeature {
  icon: string;
  title: string;
  description: string;
  comingSoon?: boolean;
}

const FEATURES: PlusFeature[] = [
  {
    icon: 'timer',
    title: 'Fasting timer',
    description: 'Track intermittent fasting windows — 16:8, OMAD or custom — with a live countdown and streaks.',
  },
  {
    icon: 'trending-up',
    title: 'Goal phases',
    description: 'Schedule cut, maintain and bulk phases. Activate one and your daily targets adjust instantly.',
  },
  {
    icon: 'bulb',
    title: 'Smart Coach',
    description: 'On-device daily guidance — protein gaps, hydration, sugar and balance — from what you logged.',
  },
  {
    icon: 'calendar',
    title: 'Meal planner',
    description: 'Plan meals for the days ahead, preview the nutrition, then log the whole day in one tap.',
  },
  {
    icon: 'cloud-upload',
    title: 'Cloud sync & backup',
    description: 'Encrypted backup across your devices. Switch phones and your whole diary comes with you.',
    comingSoon: true,
  },
  {
    icon: 'sparkles',
    title: 'Smarter recognition',
    description: 'Cloud-assisted photo analysis: multiple foods per plate and portion estimates.',
    comingSoon: true,
  },
];

export function PlatelyPlusScreen() {
  const accent = useSettings((s) => s.accent);
  const plusActive = useSettings((s) => s.plusActive);
  const setPlusActive = useSettings((s) => s.setPlusActive);

  const onSubscribe = () => {
    Alert.alert(
      'Start your Plately+ preview?',
      'Billing is still in development, so this unlocks the Plately+ extras locally with no charge. The free core of Plately stays free forever.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Unlock preview', onPress: () => setPlusActive(true) },
      ],
    );
  };

  const onTurnOff = () => {
    Alert.alert('Turn off Plately+?', 'You can re-enable the preview any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Turn off', style: 'destructive', onPress: () => setPlusActive(false) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { borderColor: accent }]}>
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Ionicons name="star" size={16} color={palette.white} />
            <Text style={styles.badgeText}>PLATELY+</Text>
          </View>
          <Text style={styles.heroTitle}>Power features, when you want them</Text>
          <Text style={styles.heroSub}>
            Everything you use today stays free. Plately+ adds optional extras that run on cloud
            infrastructure — so they carry a small subscription to keep the lights on, honestly.
          </Text>
        </View>

        {FEATURES.map((f) => (
          <Card key={f.title} style={styles.featureCard}>
            <View style={[styles.iconWrap, { backgroundColor: palette.surfaceAlt }]}>
              <Ionicons name={f.icon as never} size={22} color={accent} />
            </View>
            <View style={styles.featureBody}>
              <View style={styles.featureTitleRow}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                {f.comingSoon ? (
                  <Text style={styles.soonTag}>SOON</Text>
                ) : (
                  <Ionicons name="checkmark-circle" size={15} color={accent} />
                )}
              </View>
              <Text style={styles.featureDesc}>{f.description}</Text>
            </View>
          </Card>
        ))}

        <Card style={styles.priceCard}>
          <Text style={styles.price}>
            $3.99<Text style={styles.priceUnit}> / month</Text>
          </Text>
          <Text style={styles.priceAlt}>or $29.99 / year</Text>
          {plusActive ? (
            <>
              <View style={styles.activeRow}>
                <Ionicons name="checkmark-circle" size={20} color={accent} />
                <Text style={[styles.activeText, { color: accent }]}>Plately+ active</Text>
              </View>
              <Button label="Turn off Plately+" variant="ghost" onPress={onTurnOff} style={styles.cta} />
            </>
          ) : (
            <Button label="Try Plately+ free" onPress={onSubscribe} style={styles.cta} />
          )}
          <Text style={styles.fineprint}>
            No charge today — billing is still in development, so Plately+ unlocks locally for now.
            The free core of Plately — photo recognition, custom foods, insights, export — is never
            paywalled.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  hero: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { color: palette.white, fontSize: font.size.xs, fontFamily: font.family.uiBold, letterSpacing: 1 },
  heroTitle: { color: palette.text, fontSize: font.size.xl, fontFamily: font.family.uiBold },
  heroSub: { color: palette.textMuted, fontSize: font.size.sm, lineHeight: 19 },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  featureBody: { flex: 1, gap: 2 },
  featureTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  featureTitle: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
  soonTag: {
    color: palette.textFaint,
    fontSize: 9,
    fontFamily: font.family.uiBold,
    letterSpacing: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  featureDesc: { color: palette.textMuted, fontSize: font.size.sm, lineHeight: 18 },
  priceCard: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  price: { color: palette.text, fontSize: font.size.xxl, fontFamily: font.family.monoBold },
  priceUnit: { color: palette.textMuted, fontSize: font.size.md, fontFamily: font.family.ui },
  priceAlt: { color: palette.textMuted, fontSize: font.size.sm },
  cta: { alignSelf: 'stretch', marginTop: spacing.sm },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  activeText: { fontSize: font.size.md, fontFamily: font.family.uiSemibold },
  fineprint: { color: palette.textFaint, fontSize: font.size.xs, lineHeight: 16, textAlign: 'center', marginTop: spacing.sm },
});
