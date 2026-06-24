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

import { useMemo } from 'react';
import { StyleSheet, View, Text, type ViewProps } from 'react-native';

import { radius, spacing, font, shadow } from '../theme';
import { useTheme } from '../theme/ThemeContext';

/** Standard white card surface. Default padding is `spacing.lg`. */
export function Card({ style, children, ...rest }: ViewProps) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      ...shadow.card,
    },
    sectionTitle: {
      color: p.textMuted,
      fontSize: font.size.sm,
      fontFamily: font.family.uiSemibold,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
  });
}
