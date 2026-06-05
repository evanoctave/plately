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
}

const FEATURES: PlusFeature[] = [
  {
    icon: 'trending-up',
    title: 'Cut & bulk cycles',
    description: 'Schedule goal phases — cut, maintain, bulk — and let targets auto-adjust to your weigh-in trend.',
  },
  {
    icon: 'cloud-upload',
    title: 'Cloud sync & backup',
    description: 'Encrypted backup across your devices. Switch phones and your whole diary comes with you.',
  },
  {
    icon: 'sparkles',
    title: 'Smarter recognition',
    description: 'Cloud-assisted photo analysis: multiple foods per plate and portion estimates.',
  },
  {
    icon: 'fast-food',
    title: 'Restaurant & fast-food menus',
    description: 'Search chain and restaurant menu items — not just grocery barcodes.',
  },
  {
    icon: 'images',
    title: 'Photo meal journal',
    description: 'Keep a visual timeline of every meal with the photos you snap.',
  },
];

export function PlatelyPlusScreen() {
  const accent = useSettings((s) => s.accent);
  const plusActive = useSettings((s) => s.plusActive);

  const onSubscribe = () => {
    Alert.alert(
      'Plately+ is coming soon',
      'These power features are in active development. The free core of Plately stays free forever — Plately+ is optional, for the extras that need cloud infrastructure.',
      [{ text: 'Got it' }],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { borderColor: accent }]}>
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Ionicons name="star" size={16} color={palette.black} />
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
              <Text style={styles.featureTitle}>{f.title}</Text>
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
            <View style={styles.activeRow}>
              <Ionicons name="checkmark-circle" size={20} color={accent} />
              <Text style={[styles.activeText, { color: accent }]}>Plately+ active</Text>
            </View>
          ) : (
            <Button label="Notify me at launch" onPress={onSubscribe} style={styles.cta} />
          )}
          <Text style={styles.fineprint}>
            No charge today. The free core of Plately — photo recognition, custom foods, insights,
            export — is never paywalled.
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
  badgeText: { color: palette.black, fontSize: font.size.xs, fontWeight: font.weight.bold, letterSpacing: 1 },
  heroTitle: { color: palette.text, fontSize: font.size.xl, fontWeight: font.weight.bold },
  heroSub: { color: palette.textMuted, fontSize: font.size.sm, lineHeight: 19 },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  featureBody: { flex: 1, gap: 2 },
  featureTitle: { color: palette.text, fontSize: font.size.md, fontWeight: font.weight.semibold },
  featureDesc: { color: palette.textMuted, fontSize: font.size.sm, lineHeight: 18 },
  priceCard: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  price: { color: palette.text, fontSize: font.size.xxl, fontWeight: font.weight.bold },
  priceUnit: { color: palette.textMuted, fontSize: font.size.md, fontWeight: font.weight.regular },
  priceAlt: { color: palette.textMuted, fontSize: font.size.sm },
  cta: { alignSelf: 'stretch', marginTop: spacing.sm },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  activeText: { fontSize: font.size.md, fontWeight: font.weight.semibold },
  fineprint: { color: palette.textFaint, fontSize: font.size.xs, lineHeight: 16, textAlign: 'center', marginTop: spacing.sm },
});
