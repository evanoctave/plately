// =============================================================================
// QuickAdd — Horizontal strip of one-tap log chips
// =============================================================================
// Renders the list of suggested foods from `useQuickAdd` as a horizontal
// scroll of small cards. Each chip:
//   - Tap → onQuickLog (log instantly at the suggested grams; fires haptic)
//   - Long-press → onOpen (jump to ConfirmFood for fine-tuning grams)
// Favorites show a star icon; recents show a clock.

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { palette, spacing, font, radius } from '../theme';
import { fmtInt } from '../utils/format';
import type { QuickAddItem } from '../state/useQuickAdd';

interface QuickAddProps {
  items: QuickAddItem[];
  /** One-tap log at the suggested grams. */
  onQuickLog: (item: QuickAddItem) => void;
  /** Long-press to open the confirm screen for fine adjustment. */
  onOpen: (item: QuickAddItem) => void;
}

/** Horizontal strip of favorite/recent foods for one-tap logging. */
export function QuickAdd({ items, onQuickLog, onOpen }: QuickAddProps) {
  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => {
        const kcal = Math.round((item.food.per100g.calories * item.grams) / 100);
        return (
          <Pressable
            key={item.food.id}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onQuickLog(item);
            }}
            onLongPress={() => onOpen(item)}
            accessibilityRole="button"
            accessibilityLabel={`Quick add ${item.food.name}, ${kcal} calories`}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <View style={styles.chipHeader}>
              <Ionicons
                name={item.favorite ? 'star' : 'time-outline'}
                size={12}
                color={item.favorite ? palette.amber : palette.textFaint}
              />
              <Ionicons name="add-circle" size={16} color={palette.green} />
            </View>
            <Text style={styles.chipName} numberOfLines={1}>
              {item.food.name}
            </Text>
            <Text style={styles.chipMeta}>
              {fmtInt(kcal)} kcal · {fmtInt(item.grams)} g
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    width: 130,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  pressed: { opacity: 0.7 },
  chipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipName: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold, marginTop: 2 },
  chipMeta: { color: palette.textMuted, fontSize: font.size.xs },
});
