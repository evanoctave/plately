// =============================================================================
// AuthScreen — Real account creation / sign-in
// =============================================================================
// Backed by Supabase (see src/auth). Email/password + Sign in with Apple, with
// inline validation + error states and a loading state on submit. The ToS box
// must be checked before any provider runs. "Skip" keeps the local guest mode
// (no account, no cloud sync). On success we complete onboarding and reset into
// the tab navigator; the auth listener mirrors the session into settings.

import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, font, radius, shadow } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../state/useSettings';
import { isSupabaseConfigured } from '../config/env';
import { signInWithApple, signInWithEmail, signUpWithEmail, isAppleAuthAvailable } from '../auth/actions';
import { validateCredentials } from '../auth/validation';
import type { RootStackScreenProps } from '../navigation/types';

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
    title: { color: p.text, fontSize: 28, fontFamily: font.family.uiBold, letterSpacing: -0.6 },
    sub: { color: p.textMuted, fontSize: font.size.md, marginTop: spacing.xs, lineHeight: 22 },
    label: { color: p.text, fontSize: font.size.sm, fontFamily: font.family.uiSemibold },
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: '#FEECEC', borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.lg,
    },
    errorText: { flex: 1, color: p.red, fontSize: font.size.sm, lineHeight: 18 },
    input: {
      backgroundColor: p.surface, borderRadius: radius.lg,
      paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      fontSize: font.size.md, color: p.text,
      borderWidth: 1, borderColor: p.border,
    },
    appleBtn: {
      backgroundColor: p.text, borderRadius: radius.pill,
      paddingVertical: spacing.md + 2, gap: spacing.sm,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    },
    appleText: { color: p.white, fontSize: font.size.md, fontFamily: font.family.uiBold },
    outlineBtn: {
      backgroundColor: p.surface, borderRadius: radius.pill,
      paddingVertical: spacing.md + 2, gap: spacing.sm,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: p.border, ...shadow.card,
    },
    outlineText: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    primary: {
      backgroundColor: p.text, borderRadius: radius.pill,
      paddingVertical: spacing.md + 2, alignItems: 'center', justifyContent: 'center', minHeight: 50,
    },
    primaryText: { color: p.white, fontSize: font.size.md, fontFamily: font.family.uiBold },
    disabled: { opacity: 0.5 },
    guestRow: { alignItems: 'center', paddingVertical: spacing.md },
    guestText: { color: p.textMuted, fontSize: font.size.sm, fontFamily: font.family.ui, textDecorationLine: 'underline' },
    linkCenter: { color: p.textMuted, fontSize: font.size.sm, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm },

    footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    tosRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    checkbox: {
      width: 18, height: 18, borderRadius: 4,
      borderWidth: 1.5, borderColor: p.border,
      alignItems: 'center', justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: p.text, borderColor: p.text },
    tosText: { flex: 1, color: p.textMuted, fontSize: font.size.xs, lineHeight: 16 },
  });
}

export function AuthScreen({ navigation, route }: RootStackScreenProps<'Auth'>) {
  const p = useTheme();
  const mode = route.params?.mode ?? 'signup';
  const setAccount = useSettings((s) => s.setAccount);
  const completeOnboarding = useSettings((s) => s.completeOnboarding);
  const configured = isSupabaseConfigured();
  const styles = useMemo(() => makeStyles(p), [p]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [agreedTos, setAgreedTos] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  const enterApp = () => {
    completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  // Guard the shared preconditions before any real provider runs.
  const guard = (): boolean => {
    if (!agreedTos) {
      setError('Please agree to the Terms and Privacy Policy to continue.');
      return false;
    }
    if (!configured) {
      Alert.alert(
        'Accounts not set up',
        'This build has no Supabase keys yet. You can continue without an account for now.',
        [{ text: 'OK' }],
      );
      return false;
    }
    return true;
  };

  const apple = async () => {
    if (!guard()) return;
    setBusy(true);
    setError(null);
    const { error: err } = await signInWithApple();
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    enterApp();
  };

  const emailSubmit = async () => {
    if (!guard()) return;
    const invalid = validateCredentials(email, password, mode === 'signin' ? 'signin' : 'signup');
    if (invalid) {
      setError(invalid.message);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = mode === 'signin'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    enterApp();
  };

  const guest = () => {
    setAccount({ provider: 'guest' });
    enterApp();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color={p.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Save your progress'}</Text>
          <Text style={styles.sub}>
            {mode === 'signin' ? 'Sign in to sync your goals and streak.' : 'Create an account so your data syncs across devices.'}
          </Text>

          {error && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={16} color={p.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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
                placeholderTextColor={p.textFaint}
                style={styles.input}
                editable={!busy}
                maxLength={254}
                accessibilityLabel="Email address"
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder={mode === 'signin' ? 'Your password' : 'At least 8 characters'}
                placeholderTextColor={p.textFaint}
                style={styles.input}
                editable={!busy}
                maxLength={128}
                accessibilityLabel="Password"
              />
              <Pressable onPress={() => void emailSubmit()} style={[styles.primary, busy && styles.disabled]} disabled={busy} accessibilityRole="button">
                {busy ? <ActivityIndicator color={p.white} /> : (
                  <Text style={styles.primaryText}>{mode === 'signin' ? 'Sign in' : 'Continue'}</Text>
                )}
              </Pressable>
              <Pressable onPress={() => { setShowEmailForm(false); setError(null); }} disabled={busy} accessibilityRole="button">
                <Text style={styles.linkCenter}>Back to options</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
              {appleAvailable && (
                <Pressable onPress={() => void apple()} style={[styles.appleBtn, busy && styles.disabled]} disabled={busy} accessibilityRole="button" accessibilityLabel="Sign in with Apple">
                  <Ionicons name="logo-apple" size={20} color={p.white} />
                  <Text style={styles.appleText}>{mode === 'signin' ? 'Sign in' : 'Continue'} with Apple</Text>
                </Pressable>
              )}

              <Pressable onPress={() => { setShowEmailForm(true); setError(null); }} style={[styles.outlineBtn, busy && styles.disabled]} disabled={busy} accessibilityRole="button" accessibilityLabel="Continue with email">
                <Ionicons name="mail" size={18} color={p.text} />
                <Text style={styles.outlineText}>{mode === 'signin' ? 'Sign in' : 'Continue'} with email</Text>
              </Pressable>

              <Pressable onPress={guest} style={({ pressed }) => [styles.guestRow, pressed && { opacity: 0.6 }]} disabled={busy} accessibilityRole="button">
                <Text style={styles.guestText}>Skip — use without an account</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => setAgreedTos(!agreedTos)} style={styles.tosRow} accessibilityRole="checkbox" accessibilityState={{ checked: agreedTos }}>
            <View style={[styles.checkbox, agreedTos && styles.checkboxOn]}>
              {agreedTos && <Ionicons name="checkmark" size={14} color={p.white} />}
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

