import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, spacing, font, radius } from '../theme';
import { searchFoods, type FoodItem } from '../data/foods';
import { fmtInt } from '../utils/format';
import type { RootStackScreenProps } from '../navigation/types';

export function SearchScreen({ navigation }: RootStackScreenProps<'Search'>) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchFoods(query), [query]);

  const pick = (food: FoodItem) =>
    navigation.replace('ConfirmFood', {
      foodId: food.id,
      source: 'search',
      suggestedGrams: food.servingGrams,
    });

  const renderItem = ({ item }: { item: FoodItem }) => (
    <Pressable onPress={() => pick(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowBody}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.category} · {fmtInt(item.per100g.calories)} kcal / 100 g
        </Text>
      </View>
      <Ionicons name="add-circle" size={24} color={palette.green} />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={palette.textFaint} />
        <TextInput
          style={styles.input}
          placeholder="Search foods…"
          placeholderTextColor={palette.textFaint}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={20} color={palette.textFaint} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No matches for “{query}”.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  input: { flex: 1, color: palette.text, fontSize: font.size.lg, paddingVertical: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  pressed: { opacity: 0.6 },
  rowBody: { flex: 1, gap: 2 },
  name: { color: palette.text, fontSize: font.size.md, fontWeight: font.weight.semibold },
  meta: { color: palette.textMuted, fontSize: font.size.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: palette.textMuted, fontSize: font.size.md },
});
