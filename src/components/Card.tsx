// =============================================================================
// Card + SectionTitle
// =============================================================================
// Two tiny presentational primitives used across nearly every screen.
//
//   Card          — a rounded white surface with a hairline border and our
//                   resting elevation shadow. Pass `style` to override padding
//                   or to make a custom shape (e.g. a tinted variant).
//   SectionTitle  — the small uppercase-ish label that appears above grouped
//                   content ("Recently logged", "Quick add", "Micronutrients").

import { StyleSheet, View, Text, type ViewProps } from 'react-native';

import { palette, radius, spacing, font, shadow } from '../theme';

/** Standard white card surface. Default padding is `spacing.lg`. */
export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    ...shadow.card,
  },
  sectionTitle: {
    color: palette.textMuted,
    fontSize: font.size.sm,
    fontFamily: font.family.uiSemibold,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
});
