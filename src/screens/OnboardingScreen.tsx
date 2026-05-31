import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { palette, spacing, font, radius } from '../theme';
import { useSettings } from '../state/useSettings';
import type { RootStackScreenProps } from '../navigation/types';

const FEATURES = [
  {
    icon: 'camera' as const,
    title: 'Snap your meal',
    body: 'Point your camera at food and get an instant estimate of what you are eating.',
  },
  {
    icon: 'nutrition' as const,
    title: 'Full nutrition picture',
    body: 'Track calories, protein, carbs, fat, key vitamins and minerals, plus water content.',
  },
  {
    icon: 'lock-closed' as const,
    title: 'Private & free',
    body: 'Analysis runs on your device. Your photos and logs never leave your phone, and it is free forever.',
  },
];

export function OnboardingScreen({ navigation }: RootStackScreenProps<'Onboarding'>) {
  const completeOnboarding = useSettings((s) => s.completeOnboarding);

  const start = () => {
    completeOnboarding();
    // Replacing avoids a back-gesture returning to onboarding.
    navigation.replace('Tabs');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="restaurant" size={40} color={palette.black} />
          </View>
          <Text style={styles.appName}>NutriSnap</Text>
          <Text style={styles.tagline}>Photo-first nutrition tracking</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={22} color={palette.green} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          Estimates are for general wellness only and are not medical or dietary advice.
        </Text>
        <Button label="Get started" onPress={start} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.xl, gap: spacing.xxl, flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    backgroundColor: palette.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  appName: { color: palette.text, fontSize: font.size.display, fontWeight: font.weight.bold },
  tagline: { color: palette.textMuted, fontSize: font.size.lg },
  features: { gap: spacing.xl },
  feature: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { color: palette.text, fontSize: font.size.lg, fontWeight: font.weight.semibold },
  featureBody: { color: palette.textMuted, fontSize: font.size.md, lineHeight: 20 },
  footer: { padding: spacing.xl, gap: spacing.md },
  disclaimer: { color: palette.textFaint, fontSize: font.size.xs, textAlign: 'center', lineHeight: 16 },
});
