import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';

import { Card, SectionTitle } from '../components/Card';
import { Button } from '../components/Button';
import { spacing, font, radius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../state/useSettings';
import { isPurchasesConfigured } from '../config/env';
import { getCurrentOffering, purchasePackage, restorePurchases } from '../iap/purchases';
import type { RootStackScreenProps } from '../navigation/types';

interface PlusFeature {
  icon: string;
  title: string;
  description: string;
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
    description: 'Your diary syncs across your devices. Switch phones and everything comes with you.',
  },
];

const PLUS_EXTRAS: { route: 'Fasting' | 'GoalPhases' | 'Coach' | 'MealPlanner'; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { route: 'Fasting', label: 'Fasting timer', sub: 'Track intermittent fasting windows', icon: 'timer-outline' },
  { route: 'GoalPhases', label: 'Goal phases', sub: 'Cut, maintain & bulk targets', icon: 'trending-up-outline' },
  { route: 'Coach', label: 'Smart Coach', sub: 'On-device daily guidance', icon: 'bulb-outline' },
  { route: 'MealPlanner', label: 'Meal planner', sub: 'Plan and pre-log your days', icon: 'calendar-outline' },
];

export function PlatelyPlusScreen({ navigation }: RootStackScreenProps<'PlatelyPlus'>) {
  const p = useTheme();
  const accent = useSettings((s) => s.accent);
  const plusActive = useSettings((s) => s.plusActive);
  const setPlusActive = useSettings((s) => s.setPlusActive);
  const configured = isPurchasesConfigured();

  const styles = useMemo(() => makeStyles(p), [p]);

  const [offering, setOffering] = useState<{ monthly: PurchasesPackage | null; annual: PurchasesPackage | null } | null>(null);
  const [loading, setLoading] = useState(configured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    void (async () => {
      try {
        const current = await getCurrentOffering();
        if (active) setOffering({ monthly: current?.monthly ?? null, annual: current?.annual ?? null });
      } catch {
        if (active) setError('Could not load subscription options.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [configured]);

  const buy = async (pkg: PurchasesPackage | null) => {
    if (!pkg) return;
    setBusy(true);
    setError(null);
    const result = await purchasePackage(pkg);
    setBusy(false);
    if (result.cancelled) return;
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.active) Alert.alert('Welcome to EvoEat+', 'All extras are unlocked. Thank you for supporting EvoEat.');
  };

  const restore = async () => {
    setBusy(true);
    setError(null);
    const result = await restorePurchases();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    Alert.alert(result.active ? 'Restored' : 'Nothing to restore', result.active ? 'Your EvoEat+ subscription is active.' : 'No previous purchase was found for this Apple ID.');
  };

  const devUnlock = () => {
    Alert.alert('Dev unlock', 'Unlock EvoEat+ locally for testing (no charge). Development builds only.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unlock', onPress: () => setPlusActive(true) },
    ]);
  };

  const monthlyPrice = offering?.monthly?.product.priceString;
  const annualPrice = offering?.annual?.product.priceString;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.hero, { borderColor: accent }]}>
          <Image
            source={require('../../assets/icon_plus.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <View style={[styles.heroBadge, { backgroundColor: '#B8860B' }]}>
            <Ionicons name="star" size={13} color="#000" />
            <Text style={styles.heroBadgeText}>PLATELY+</Text>
            <Ionicons name="sparkles" size={11} color="#FFF8D6" />
          </View>
          <Text style={styles.heroTitle}>Power features, when you want them</Text>
          <Text style={styles.heroSub}>
            Everything you use today stays free. EvoEat+ adds optional extras and cloud sync,
            with a small subscription to keep the lights on.
          </Text>
        </View>

        {/* What's included */}
        {FEATURES.map((f) => (
          <Card key={f.title} style={styles.featureCard}>
            <View style={[styles.iconWrap, { backgroundColor: p.surfaceAlt }]}>
              <Ionicons name={f.icon as never} size={22} color={accent} />
            </View>
            <View style={styles.featureBody}>
              <View style={styles.featureTitleRow}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Ionicons name="checkmark-circle" size={15} color={accent} />
              </View>
              <Text style={styles.featureDesc}>{f.description}</Text>
            </View>
          </Card>
        ))}

        {/* Paywall */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={p.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Card style={styles.priceCard}>
          {plusActive ? (
            <>
              <View style={styles.activeRow}>
                <Ionicons name="checkmark-circle" size={20} color={accent} />
                <Text style={[styles.activeText, { color: accent }]}>EvoEat+ active</Text>
              </View>
              <Text style={styles.fineprint}>
                Manage or cancel anytime from the App Store → your Apple ID → Subscriptions.
              </Text>
            </>
          ) : loading ? (
            <ActivityIndicator color={accent} />
          ) : configured ? (
            <>
              <Text style={styles.price}>
                {monthlyPrice ?? '$3.99'}<Text style={styles.priceUnit}> / month</Text>
              </Text>
              {annualPrice && <Text style={styles.priceAlt}>or {annualPrice} / year</Text>}
              <Button
                label={busy ? 'Please wait…' : `Subscribe${monthlyPrice ? ` — ${monthlyPrice}/mo` : ''}`}
                onPress={() => void buy(offering?.monthly ?? null)}
                disabled={busy || !offering?.monthly}
                style={styles.cta}
              />
              {offering?.annual && (
                <Button
                  label={`Best value — ${annualPrice}/yr`}
                  variant="secondary"
                  onPress={() => void buy(offering.annual)}
                  disabled={busy}
                  style={styles.cta}
                />
              )}
              <Pressable onPress={() => void restore()} disabled={busy} hitSlop={8}>
                <Text style={styles.restore}>Restore purchases</Text>
              </Pressable>
              <Text style={styles.fineprint}>
                Subscription auto-renews until cancelled. The free core of EvoEat — photo
                recognition, custom foods, insights, export — is never paywalled.
              </Text>
              <View style={styles.legalRow}>
                <Pressable onPress={() => navigation.navigate('Terms')} hitSlop={8}>
                  <Text style={styles.legalLink}>Terms of Use (EULA)</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable onPress={() => navigation.navigate('PrivacyPolicy')} hitSlop={8}>
                  <Text style={styles.legalLink}>Privacy Policy</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.unavailable}>Subscriptions aren't available in this build yet.</Text>
              {__DEV__ && <Button label="Dev unlock (local)" variant="ghost" onPress={devUnlock} style={styles.cta} />}
            </>
          )}
        </Card>

        {/* Quick-access extras */}
        <SectionTitle>Jump in</SectionTitle>
        <Card style={styles.extrasCard}>
          {PLUS_EXTRAS.map((extra, i) => (
            <View key={extra.route}>
              {i > 0 && <View style={styles.divider} />}
              <Pressable style={styles.linkRow} onPress={() => navigation.navigate(extra.route)}>
                <Ionicons name={extra.icon} size={20} color={plusActive ? accent : p.textMuted} />
                <View style={styles.extraBody}>
                  <Text style={styles.linkText}>{extra.label}</Text>
                  <Text style={styles.extraSub}>{extra.sub}</Text>
                </View>
                {!plusActive && <Ionicons name="lock-closed" size={15} color={p.textFaint} />}
                <Ionicons name="chevron-forward" size={18} color={p.textFaint} />
              </Pressable>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
    hero: {
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.sm,
      alignItems: 'center',
    },
    heroLogo: {
      width: 90,
      height: 90,
      marginBottom: spacing.xs,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    heroBadgeText: { color: '#000', fontSize: font.size.xs, fontFamily: font.family.uiBold, letterSpacing: 1 },
    heroTitle: { color: p.text, fontSize: font.size.xl, fontFamily: font.family.uiBold, textAlign: 'center' },
    heroSub: { color: p.textMuted, fontSize: font.size.sm, lineHeight: 19, textAlign: 'center' },
    featureCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    featureBody: { flex: 1, gap: 2 },
    featureTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    featureTitle: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    featureDesc: { color: p.textMuted, fontSize: font.size.sm, lineHeight: 18 },
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: p.surfaceAlt, borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    },
    errorText: { flex: 1, color: p.red, fontSize: font.size.sm, lineHeight: 18 },
    priceCard: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
    price: { color: p.text, fontSize: font.size.xxl, fontFamily: font.family.monoBold },
    priceUnit: { color: p.textMuted, fontSize: font.size.md, fontFamily: font.family.ui },
    priceAlt: { color: p.textMuted, fontSize: font.size.sm },
    cta: { alignSelf: 'stretch', marginTop: spacing.sm },
    restore: { color: p.textMuted, fontSize: font.size.sm, textDecorationLine: 'underline', marginTop: spacing.md },
    unavailable: { color: p.textMuted, fontSize: font.size.sm, textAlign: 'center', lineHeight: 19 },
    activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    activeText: { fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    fineprint: { color: p.textFaint, fontSize: font.size.xs, lineHeight: 16, textAlign: 'center', marginTop: spacing.sm },
    legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.sm },
    legalLink: { color: p.textMuted, fontSize: font.size.xs, textDecorationLine: 'underline' },
    legalDot: { color: p.textFaint, fontSize: font.size.xs },
    extrasCard: { paddingVertical: spacing.xs },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.border },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    linkText: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    extraBody: { flex: 1 },
    extraSub: { color: p.textMuted, fontSize: font.size.sm, marginTop: 1 },
  });
}
