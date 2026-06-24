import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing, font, radius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import type { RootStackScreenProps } from '../navigation/types';

const SUPPORT_EMAIL = 'evanoctav3@gmail.com';
const LAST_UPDATED = '2026-05-31';

// Bundled in-app so the policy is always available — independent of repo
// visibility or network. Mirrors docs/PRIVACY_POLICY.md.
export function PrivacyPolicyScreen(_props: RootStackScreenProps<'PrivacyPolicy'>) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
      <Text style={styles.lead}>
        Plately is private by default. This explains, in plain language, what the app does and does
        not do with your information.
      </Text>

      <Section title="The short version" styles={styles}>
        <Bullet styles={styles}>We do not collect, transmit, or sell any personal data.</Bullet>
        <Bullet styles={styles}>Your photos never leave your device. Food recognition runs entirely on-device.</Bullet>
        <Bullet styles={styles}>Your food diary is stored only on your device. No account, no cloud sync.</Bullet>
        <Bullet styles={styles}>
          The app makes network requests in only two cases, and neither sends personal data: a
          one-time download of the open-source recognition model, and barcode lookups you initiate
          (which send only the scanned number to Open Food Facts).
        </Bullet>
      </Section>

      <Section title="Camera & photo library" styles={styles}>
        <Body styles={styles}>
          Plately requests camera access so you can photograph meals, and optionally photo-library
          access so you can analyze an existing photo. Images are processed on your device and stored
          locally only if you save the diary entry. They are never uploaded.
        </Body>
      </Section>

      <Section title="No tracking, no analytics, no ads" styles={styles}>
        <Body styles={styles}>
          Plately contains no third-party analytics SDKs, no advertising SDKs, and no tracking
          technologies. It does not use the Advertising Identifier (IDFA) and performs no App
          Tracking Transparency–covered tracking.
        </Body>
      </Section>

      <Section title="Data deletion" styles={styles}>
        <Body styles={styles}>
          You are always in control. Settings → Erase all data permanently deletes every diary entry
          from your device. Deleting the app removes all locally stored data, including cached photos
          and the downloaded model.
        </Body>
      </Section>

      <Section title="Children's privacy" styles={styles}>
        <Body styles={styles}>
          Plately does not knowingly collect personal information from anyone, including children
          under 13.
        </Body>
      </Section>

      <Section title="Medical disclaimer" styles={styles}>
        <Body styles={styles}>
          Plately provides approximate nutrition estimates for general wellness and informational
          purposes only. It is not a medical device and does not provide medical, dietary, or
          nutritional advice, diagnosis, or treatment. Always consult a qualified healthcare
          professional regarding your diet and health.
        </Body>
      </Section>

      <Section title="Contact" styles={styles}>
        <Pressable
          style={styles.contactRow}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        >
          <Ionicons name="mail-outline" size={18} color={p.green} />
          <Text style={styles.contactText}>{SUPPORT_EMAIL}</Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children, styles }: { title: string; children: React.ReactNode; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children, styles }: { children: React.ReactNode; styles: ReturnType<typeof makeStyles> }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Bullet({ children, styles }: { children: React.ReactNode; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.dot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
    updated: { color: p.textFaint, fontSize: font.size.xs },
    lead: { color: p.textMuted, fontSize: font.size.md, lineHeight: 21 },
    section: { gap: spacing.sm },
    heading: { color: p.text, fontSize: font.size.lg, fontFamily: font.family.uiBold },
    body: { color: p.textMuted, fontSize: font.size.md, lineHeight: 21 },
    bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: p.green, marginTop: 7 },
    bulletText: { flex: 1, color: p.textMuted, fontSize: font.size.md, lineHeight: 21 },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: p.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    contactText: { color: p.green, fontSize: font.size.md, fontFamily: font.family.uiMedium },
  });
}
