import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle } from '../components/Card';
import { palette, spacing, font, radius } from '../theme';
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

// App-icon keys. The stock icon always works; alternates light up once you add
// the matching icon assets + the expo-alternate-app-icons config (see
// docs/APP_STORE_SUBMISSION.md). Selection persists regardless.
const ICONS: { key: string; name: string }[] = [
  { key: 'default', name: 'Classic' },
  { key: 'dark', name: 'Midnight' },
  { key: 'mono', name: 'Mono' },
];

export function AppearanceScreen() {
  const { accent, setAccent, appIcon, setAppIcon } = useSettings();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
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
                    {selected && <Ionicons name="checkmark" size={22} color={palette.black} />}
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
                    <Ionicons name="nutrition" size={22} color={palette.black} />
                  </View>
                  <Text style={styles.iconName}>{ic.name}</Text>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={selected ? accent : palette.textFaint}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
  swatchSelected: { borderColor: palette.text },
  swatchName: { color: palette.textMuted, fontSize: font.size.xs, textAlign: 'center' },
  note: { color: palette.textFaint, fontSize: font.size.sm, lineHeight: 18 },
  iconCard: { paddingVertical: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  iconPreview: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  iconName: { flex: 1, color: palette.text, fontSize: font.size.md },
});
