import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing, font, radius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import type { RootStackScreenProps } from '../navigation/types';

const SUPPORT_EMAIL = 'evanoctav3@gmail.com';
const LAST_UPDATED = '2026-06-24';

// Bundled in-app so the terms are always available — independent of repo
// visibility or network.
export function TermsScreen(_props: RootStackScreenProps<'Terms'>) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
      <Text style={styles.lead}>
        These Terms of Service govern your use of Plately. By creating an account or using the app,
        you agree to them.
      </Text>

      <Section title="Using Plately" styles={styles}>
        <Body styles={styles}>
          Plately is a personal nutrition and food-logging tool. You may use it for your own
          personal, non-commercial purposes. You are responsible for the accuracy of the information
          you log and for keeping your account credentials secure.
        </Body>
      </Section>

      <Section title="Accounts" styles={styles}>
        <Body styles={styles}>
          You can use Plately without an account in guest mode, or sign in with email, Apple, or
          Google to sync across devices. You must be at least 13 years old to create an account. You
          are responsible for activity that happens under your account.
        </Body>
      </Section>

      <Section title="Plately+ subscriptions" styles={styles}>
        <Body styles={styles}>
          Plately+ is an optional auto-renewing subscription that unlocks extra features. Payment is
          charged to your Apple ID at confirmation of purchase. Subscriptions renew automatically
          unless cancelled at least 24 hours before the end of the current period. Manage or cancel
          anytime in your device Settings → Apple ID → Subscriptions. Prices are shown in the app
          before purchase.
        </Body>
      </Section>

      <Section title="Acceptable use" styles={styles}>
        <Bullet styles={styles}>Do not misuse, disrupt, or attempt to reverse-engineer the app.</Bullet>
        <Bullet styles={styles}>Do not use Plately for any unlawful purpose.</Bullet>
        <Bullet styles={styles}>Do not attempt to access other users' data.</Bullet>
      </Section>

      <Section title="Medical disclaimer" styles={styles}>
        <Body styles={styles}>
          Plately provides approximate nutrition estimates for general wellness and informational
          purposes only. It is not a medical device and does not provide medical, dietary, or
          nutritional advice, diagnosis, or treatment. Always consult a qualified healthcare
          professional regarding your diet and health.
        </Body>
      </Section>

      <Section title="No warranty" styles={styles}>
        <Body styles={styles}>
          Plately is provided "as is" without warranties of any kind. Nutrition values are estimates
          and may be inaccurate. We do not guarantee the app will be uninterrupted or error-free.
        </Body>
      </Section>

      <Section title="Limitation of liability" styles={styles}>
        <Body styles={styles}>
          To the fullest extent permitted by law, Plately and its developer are not liable for any
          indirect, incidental, or consequential damages arising from your use of the app.
        </Body>
      </Section>

      <Section title="Changes" styles={styles}>
        <Body styles={styles}>
          We may update these terms from time to time. Continued use of the app after changes take
          effect means you accept the updated terms.
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
