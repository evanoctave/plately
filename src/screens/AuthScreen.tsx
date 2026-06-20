import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing, font, radius, shadow } from '../theme';
import { useSettings } from '../state/useSettings';
import type { RootStackScreenProps } from '../navigation/types';

export function AuthScreen({ navigation, route }: RootStackScreenProps<'Auth'>) {
  const mode = route.params?.mode ?? 'signup';
  const setAccount = useSettings((s) => s.setAccount);
  const completeOnboarding = useSettings((s) => s.completeOnboarding);

  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [agreedTos, setAgreedTos] = useState(true);

  const finish = (provider: 'apple' | 'google' | 'email' | 'guest', info: Partial<{ email: string; name: string }> = {}) => {
    setAccount({ provider, ...info });
    completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const apple = () => {
    // Real Apple Sign In requires expo-apple-authentication and Apple Developer setup.
    // For now: stub success so the flow is complete and testable.
    finish('apple', { name: 'Apple user' });
  };

  const google = () => {
    Alert.alert('Google sign-in', 'Google OAuth requires a backend or Firebase. Coming soon.');
  };

  const emailSubmit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    finish('email', { email });
  };

  const guest = () => finish('guest');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color={palette.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Save your progress'}</Text>
          <Text style={styles.sub}>
            {mode === 'signin' ? 'Sign in to sync your goals and streak.' : 'Create an account so your data syncs across devices.'}
          </Text>

          {showEmailForm ? (
            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={palette.textFaint}
                style={styles.input}
                accessibilityLabel="Email address"
              />
              <Pressable onPress={emailSubmit} style={styles.primary} accessibilityRole="button">
                <Text style={styles.primaryText}>{mode === 'signin' ? 'Sign in' : 'Continue'}</Text>
              </Pressable>
              <Pressable onPress={() => setShowEmailForm(false)} accessibilityRole="button">
                <Text style={styles.linkCenter}>Back to options</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
              <Pressable onPress={apple} style={styles.appleBtn} accessibilityRole="button" accessibilityLabel="Sign in with Apple">
                <Ionicons name="logo-apple" size={20} color={palette.white} />
                <Text style={styles.appleText}>{mode === 'signin' ? 'Sign in' : 'Continue'} with Apple</Text>
              </Pressable>

              <Pressable onPress={google} style={styles.outlineBtn} accessibilityRole="button" accessibilityLabel="Sign in with Google">
                <Ionicons name="logo-google" size={18} color={palette.text} />
                <Text style={styles.outlineText}>{mode === 'signin' ? 'Sign in' : 'Continue'} with Google</Text>
              </Pressable>

              <Pressable onPress={() => setShowEmailForm(true)} style={styles.outlineBtn} accessibilityRole="button" accessibilityLabel="Continue with email">
                <Ionicons name="mail" size={18} color={palette.text} />
                <Text style={styles.outlineText}>{mode === 'signin' ? 'Sign in' : 'Continue'} with email</Text>
              </Pressable>

              <Pressable onPress={guest} style={({ pressed }) => [styles.guestRow, pressed && { opacity: 0.6 }]} accessibilityRole="button">
                <Text style={styles.guestText}>Skip — use without an account</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => setAgreedTos(!agreedTos)} style={styles.tosRow} accessibilityRole="checkbox" accessibilityState={{ checked: agreedTos }}>
            <View style={[styles.checkbox, agreedTos && styles.checkboxOn]}>
              {agreedTos && <Ionicons name="checkmark" size={14} color={palette.white} />}
            </View>
            <Text style={styles.tosText}>
              I agree to Plately's Terms and Privacy Policy.
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  title: { color: palette.text, fontSize: 28, fontFamily: font.family.uiBold, letterSpacing: -0.6 },
  sub: { color: palette.textMuted, fontSize: font.size.md, marginTop: spacing.xs, lineHeight: 22 },
  label: { color: palette.text, fontSize: font.size.sm, fontFamily: font.family.uiSemibold },
  input: {
    backgroundColor: palette.surface, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: font.size.md, color: palette.text,
    borderWidth: 1, borderColor: palette.border,
  },
  appleBtn: {
    backgroundColor: palette.text, borderRadius: radius.pill,
    paddingVertical: spacing.md + 2, gap: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  appleText: { color: palette.white, fontSize: font.size.md, fontFamily: font.family.uiBold },
  outlineBtn: {
    backgroundColor: palette.surface, borderRadius: radius.pill,
    paddingVertical: spacing.md + 2, gap: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: palette.border, ...shadow.card,
  },
  outlineText: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
  primary: {
    backgroundColor: palette.text, borderRadius: radius.pill,
    paddingVertical: spacing.md + 2, alignItems: 'center',
  },
  primaryText: { color: palette.white, fontSize: font.size.md, fontFamily: font.family.uiBold },
  guestRow: { alignItems: 'center', paddingVertical: spacing.md },
  guestText: { color: palette.textMuted, fontSize: font.size.sm, fontFamily: font.family.ui, textDecorationLine: 'underline' },
  linkCenter: { color: palette.textMuted, fontSize: font.size.sm, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm },

  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  tosRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: palette.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: palette.text, borderColor: palette.text },
  tosText: { flex: 1, color: palette.textMuted, fontSize: font.size.xs, lineHeight: 16 },
});
