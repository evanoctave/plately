import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, font, radius, shadow } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import type { RootStackScreenProps } from '../navigation/types';

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: {
      flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl,
      justifyContent: 'center', gap: spacing.xxl,
    },
    hero: { alignItems: 'center', gap: spacing.sm },
    logo: {
      width: 72, height: 72, borderRadius: 22,
      backgroundColor: p.text,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    brand: {
      color: p.text, fontSize: font.size.display,
      fontFamily: font.family.uiBold, letterSpacing: -1.5,
    },
    tagline: {
      color: p.textMuted, fontSize: font.size.md,
      fontFamily: font.family.ui, textAlign: 'center', lineHeight: 22,
    },

    previewCard: {
      backgroundColor: p.surface, borderRadius: radius.xl,
      padding: spacing.lg, gap: spacing.md,
      borderWidth: StyleSheet.hairlineWidth, borderColor: p.border,
      ...shadow.card,
    },
    previewRow: { flexDirection: 'row', alignItems: 'center' },
    previewMini: { flex: 1 },
    previewMiniNum: { color: p.text, fontSize: 36, fontFamily: font.family.uiBold, letterSpacing: -1 },
    previewMiniLbl: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.uiMedium, marginTop: 2 },
    previewRing: {
      width: 64, height: 64, borderRadius: 32,
      borderWidth: 4, borderColor: p.accentSoft,
      alignItems: 'center', justifyContent: 'center',
    },
    previewMacros: { flexDirection: 'row', gap: spacing.sm },
    previewMacro: { flex: 1, padding: spacing.sm, backgroundColor: p.surfaceAlt, borderRadius: radius.md },
    previewMacroV: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiBold },
    previewMacroL: { color: p.textMuted, fontSize: font.size.xs, marginTop: 1 },

    bullet: { gap: spacing.sm },
    bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    bulletText: { color: p.text, fontSize: font.size.md, fontFamily: font.family.ui },

    footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
    primaryCta: {
      backgroundColor: p.text, borderRadius: radius.pill,
      paddingVertical: spacing.md + 2, alignItems: 'center',
    },
    primaryCtaText: { color: p.white, fontSize: font.size.md, fontFamily: font.family.uiBold },
    signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.sm },
    signinFaint: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.ui },
    signinLink: { color: p.text, fontSize: font.size.sm, fontFamily: font.family.uiSemibold, textDecorationLine: 'underline' },
  });
}

export function OnboardingScreen({ navigation }: RootStackScreenProps<'Onboarding'>) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="restaurant" size={36} color={p.white} />
          </View>
          <Text style={styles.brand}>Plately</Text>
          <Text style={styles.tagline}>
            Photo-first nutrition tracking.{'\n'}On-device. Private. Free.
          </Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <View style={styles.previewMini}>
              <Text style={styles.previewMiniNum}>1739</Text>
              <Text style={styles.previewMiniLbl}>Calories left</Text>
            </View>
            <View style={styles.previewRing}>
              <Ionicons name="flame" size={24} color={p.accent} />
            </View>
          </View>
          <View style={styles.previewMacros}>
            {[
              { l: 'Protein', v: '136g' },
              { l: 'Carbs', v: '206g' },
              { l: 'Fat', v: '41g' },
            ].map((m) => (
              <View key={m.l} style={styles.previewMacro}>
                <Text style={styles.previewMacroV}>{m.v}</Text>
                <Text style={styles.previewMacroL}>{m.l} left</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bullet}>
          <Bullet text="Snap a meal — recognized on device" styles={styles} accent={p.accent} />
          <Bullet text="Full nutrition: macros, micros, water" styles={styles} accent={p.accent} />
          <Bullet text="Daily streaks that don't manipulate" styles={styles} accent={p.accent} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => navigation.navigate('OnboardingFlow')}
          style={styles.primaryCta}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.primaryCtaText}>Get started</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          style={({ pressed }) => [styles.signinRow, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.signinFaint}>Already have an account? </Text>
          <Text style={styles.signinLink}>Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Bullet({ text, styles, accent }: { text: string; styles: ReturnType<typeof makeStyles>; accent: string }) {
  return (
    <View style={styles.bulletRow}>
      <Ionicons name="checkmark-circle" size={18} color={accent} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}
