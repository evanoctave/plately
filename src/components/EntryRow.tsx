// =============================================================================
// EntryRow — One row in the diary list
// =============================================================================
// Renders a single `FoodEntry`: photo thumbnail (or an emoji icon for non-photo
// sources), name + grams + time, calories on the right. Water entries hide
// the calorie column and show "mL" instead of "g". Tappable: long-press fires
// `onLongPress` (used by the consumer to confirm a delete).

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';

import { palette, radius, spacing, font } from '../theme';
import { fmtInt } from '../utils/format';
import { prettyTime } from '../utils/date';
import type { FoodEntry } from '../db/database';

const SOURCE_ICON: Record<FoodEntry['source'], string> = {
  photo: '📷',
  search: '🔍',
  manual: '✏️',
  water: '💧',
};

interface EntryRowProps {
  entry: FoodEntry;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function EntryRow({ entry, onPress, onLongPress }: EntryRowProps) {
  const isWater = entry.source === 'water';
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.name}, ${fmtInt(entry.calories)} calories`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {entry.photoUri ? (
        <Image source={{ uri: entry.photoUri }} style={styles.thumb} contentFit="cover" transition={120} />
      ) : (
        <View style={styles.iconThumb}>
          <Text style={styles.icon}>{SOURCE_ICON[entry.source]}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={styles.meta}>
          {isWater ? `${fmtInt(entry.water)} mL` : `${fmtInt(entry.grams)} g`} · {prettyTime(entry.createdAt)}
        </Text>
      </View>

      {!isWater && (
        <View style={styles.right}>
          <Text style={styles.kcal}>{fmtInt(entry.calories)}</Text>
          <Text style={styles.kcalUnit}>kcal</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 6,
  },
  pressed: { opacity: 0.6 },
  thumb: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.surfaceAlt },
  iconThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  body: { flex: 1 },
  name: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
  meta: { color: palette.textMuted, fontSize: font.size.sm, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  kcal: { color: palette.text, fontSize: font.size.lg, fontFamily: font.family.monoBold },
  kcalUnit: { color: palette.textFaint, fontSize: font.size.xs },
});
