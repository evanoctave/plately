import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle } from '../components/Card';
import { spacing, font, radius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings, DEFAULT_ACCENT } from '../state/useSettings';

const ACCENTS: { hex: string; name: string }[] = [
  { hex: DEFAULT_ACCENT, name: 'Plately Green' },
  { hex: '#0A84FF', name: 'Ocean Blue' },
  { hex: '#30B0C7', name: 'Teal' },
  { hex: '#FF9F0A', name: 'Amber' },
  { hex: '#FF453A', name: 'Coral' },
  { hex: '#BF5AF2', name: 'Grape' },
  { hex: '#FF375F', name: 'Rose' },
  { hex: '#FFD60A', name: 'Sunflower' },
];

const ICONS: { key: string; name: string }[] = [
  { key: 'default', name: 'Classic' },
  { key: 'dark', name: 'Midnight' },
  { key: 'mono', name: 'Mono' },
];

export function AppearanceScreen() {
  const p = useTheme();
  const { accent, setAccent, appIcon, setAppIcon, darkMode, setDarkMode } = useSettings();
  const styles = useMemo(() => makeStyles(p), [p]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle>Color scheme</SectionTitle>
        <Card style={styles.schemeCard}>
          <View style={styles.linkRow}>
            <Ionicons name="moon-outline" size={20} color={p.text} />
            <View style={styles.schemeBody}>
              <Text style={styles.schemeLabel}>Dark mode</Text>
              <Text style={styles.schemeSub}>Easier on the eyes at night</Text>
            </View>
            <Pressable
              onPress={() => setDarkMode(!darkMode)}
              style={[styles.switch, darkMode && { backgroundColor: accent }]}
              accessibilityRole="switch"
              accessibilityState={{ checked: darkMode }}
            >
              <View style={[styles.knob, darkMode && styles.knobOn]} />
            </Pressable>
          </View>
        </Card>

        <SectionTitle>Accent color</SectionTitle>
        <Card style={styles.card}>
          <View style={styles.swatchGrid}>
            {ACCENTS.map((a) => {
              const selected = accent.toLowerCase() === a.hex.toLowerCase();
              return (
                <Pressable
                  key={a.hex}
                  style={styles.swatchCell}
                  onPress={() => setAccent(a.hex)}
                  accessibilityRole="button"
                  accessibilityLabel={a.name}
                >
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: a.hex },
                      selected && styles.swatchSelected,
                    ]}
                  >
                    {selected && <Ionicons name="checkmark" size={22} color={p.black} />}
                  </View>
                  <Text style={styles.swatchName} numberOfLines={1}>
                    {a.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.note}>Tints the tab bar, highlights, and progress throughout the app.</Text>
        </Card>

        <SectionTitle>App icon</SectionTitle>
        <Card style={styles.iconCard}>
          {ICONS.map((ic, i) => {
            const selected = appIcon === ic.key;
            return (
              <View key={ic.key}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable style={styles.iconRow} onPress={() => setAppIcon(ic.key)}>
                  <View style={[styles.iconPreview, { backgroundColor: accent }]}>
                    <Ionicons name="nutrition" size={22} color={p.black} />
                  </View>
                  <Text style={styles.iconName}>{ic.name}</Text>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={selected ? accent : p.textFaint}
                  />
                </Pressable>
              </View>
            );
          })}
          <Text style={styles.note}>
            Alternate icons apply once their image assets ship with the app. Your choice is saved
            now and takes effect automatically when they do.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    schemeCard: { paddingVertical: spacing.xs },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    schemeBody: { flex: 1 },
    schemeLabel: { color: p.text, fontSize: font.size.md },
    schemeSub: { color: p.textMuted, fontSize: font.size.sm, marginTop: 1 },
    switch: { width: 44, height: 26, borderRadius: radius.pill, backgroundColor: p.border, padding: 3, justifyContent: 'center' },
    knob: { width: 20, height: 20, borderRadius: radius.pill, backgroundColor: p.white },
    knobOn: { alignSelf: 'flex-end' },
    card: { gap: spacing.sm },
    swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
    swatchCell: { width: '22%', alignItems: 'center', gap: spacing.xs },
    swatch: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchSelected: { borderColor: p.text },
    swatchName: { color: p.textMuted, fontSize: font.size.xs, textAlign: 'center' },
    note: { color: p.textFaint, fontSize: font.size.sm, lineHeight: 18 },
    iconCard: { paddingVertical: spacing.xs },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.border },
    iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    iconPreview: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    iconName: { flex: 1, color: p.text, fontSize: font.size.md },
  });
}
