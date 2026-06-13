import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Button } from '../components/Button';
import { palette, spacing, font, radius } from '../theme';
import { getCustomFoods, deleteCustomFood } from '../db/customFoods';
import { refreshCustomFoods } from '../data/catalog';
import type { FoodItem } from '../data/foods';
import { fmtInt } from '../utils/format';
import type { RootStackScreenProps } from '../navigation/types';

export function MyFoodsScreen({ navigation }: RootStackScreenProps<'MyFoods'>) {
  const [foods, setFoods] = useState<FoodItem[]>([]);

  const load = useCallback(async () => {
    setFoods(await getCustomFoods());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const confirmDelete = (food: FoodItem) => {
    Alert.alert('Delete food', `Delete "${food.name}"? Past diary entries are kept.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomFood(food.id);
          await refreshCustomFoods();
          await load();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: FoodItem }) => (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {fmtInt(item.per100g.calories)} kcal / 100 g · serving {fmtInt(item.servingGrams)} g
        </Text>
      </View>
      <Pressable
        onPress={() => confirmDelete(item)}
        accessibilityLabel={`Delete ${item.name}`}
        style={({ pressed }) => [styles.delBtn, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="trash-outline" size={20} color={palette.red} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={36} color={palette.textFaint} />
            <Text style={styles.emptyText}>No custom foods yet.</Text>
            <Text style={styles.emptySub}>
              Create your own foods once and reuse them anytime — free.
            </Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <Button label="Create a food" onPress={() => navigation.navigate('AddCustomFood')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowBody: { flex: 1, gap: 2 },
  name: { color: palette.text, fontSize: font.size.md, fontFamily: font.family.uiSemibold },
  meta: { color: palette.textMuted, fontSize: font.size.sm },
  delBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  empty: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xxl * 2, paddingHorizontal: spacing.xl },
  emptyText: { color: palette.textMuted, fontSize: font.size.lg, fontFamily: font.family.uiSemibold },
  emptySub: { color: palette.textFaint, fontSize: font.size.sm, textAlign: 'center' },
  footer: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
});
