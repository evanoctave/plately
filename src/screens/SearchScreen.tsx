import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { spacing, font, radius } from '../theme';
import type { Palette } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { searchCatalog, refreshCustomFoods } from '../data/catalog';
import { isCustomId } from '../db/customFoods';
import type { FoodItem } from '../data/foods';
import { fmtInt } from '../utils/format';
import type { RootStackScreenProps } from '../navigation/types';

export function SearchScreen({ navigation }: RootStackScreenProps<'Search'>) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState(0);

  // Refresh custom foods whenever this screen gains focus (e.g. after creating
  // one), then re-run the search.
  useFocusEffect(
    useCallback(() => {
      void refreshCustomFoods().then(() => setVersion((v) => v + 1));
    }, []),
  );

  // `version` bumps after a custom-food refresh to force a re-query. The
  // catalog is small, so searching on each render is cheap and avoids stale
  // memoization across the module-level catalog cache.
  void version;
  const results = searchCatalog(query);

  const pick = (food: FoodItem) =>
    navigation.replace('ConfirmFood', {
      foodId: food.id,
      source: 'search',
      suggestedGrams: food.servingGrams,
    });

  const renderItem = ({ item }: { item: FoodItem }) => (
    <Pressable onPress={() => pick(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {isCustomId(item.id) && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Custom</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {item.category} · {fmtInt(item.per100g.calories)} kcal / 100 g
        </Text>
      </View>
      <Ionicons name="add-circle" size={24} color={p.green} />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={p.textFaint} />
        <TextInput
          style={styles.input}
          placeholder="Search foods…"
          placeholderTextColor={p.textFaint}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={20} color={p.textFaint} />
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
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() => navigation.navigate('BarcodeScan')}
              style={({ pressed }) => [styles.createRow, pressed && styles.pressed]}
            >
              <View style={styles.createIcon}>
                <Ionicons name="barcode-outline" size={22} color={p.teal} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.name}>Scan a barcode</Text>
                <Text style={styles.meta}>Free lookup via Open Food Facts</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={p.textFaint} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('AddCustomFood')}
              style={({ pressed }) => [styles.createRow, pressed && styles.pressed]}
            >
              <View style={styles.createIcon}>
                <Ionicons name="add" size={22} color={p.green} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.name}>Create a custom food</Text>
                <Text style={styles.meta}>Add your own — free, no account</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={p.textFaint} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No matches for “{query}”.</Text>
            <Text style={styles.emptySub}>Tap “Create a custom food” above to add it yourself.</Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(p: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.bg },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      margin: spacing.lg,
      paddingHorizontal: spacing.md,
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    input: { flex: 1, color: p.text, fontSize: font.size.lg, paddingVertical: spacing.md },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
    createRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.border,
    },
    createIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: p.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    pressed: { opacity: 0.6 },
    rowBody: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: { color: p.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
    badge: {
      backgroundColor: p.surfaceAlt,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 1,
    },
    badgeText: { color: p.textMuted, fontSize: font.size.xs, fontFamily: font.family.uiSemibold },
    meta: { color: p.textMuted, fontSize: font.size.sm },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.border },
    empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
    emptyText: { color: p.textMuted, fontSize: font.size.md },
    emptySub: { color: p.textFaint, fontSize: font.size.sm, textAlign: 'center' },
  });
}
