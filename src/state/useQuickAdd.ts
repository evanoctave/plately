import { useCallback, useEffect, useState } from 'react';

import { getRecentFoods } from '../db/stats';
import { getFavoriteIds } from '../db/favorites';
import { getFood, refreshCustomFoods } from '../data/catalog';
import type { FoodItem } from '../data/foods';
import { useDiaryRevision } from './useDiary';

export interface QuickAddItem {
  food: FoodItem;
  grams: number;
  favorite: boolean; // from favorites vs recents
}

// Quick-add suggestions: favorites first, then recents (de-duplicated).
export function useQuickAdd(limit = 10): { items: QuickAddItem[]; reload: () => Promise<void> } {
  const revision = useDiaryRevision((s) => s.revision);
  const [items, setItems] = useState<QuickAddItem[]>([]);

  const reload = useCallback(async () => {
    await refreshCustomFoods();
    const [favIds, recents] = await Promise.all([getFavoriteIds(), getRecentFoods(limit)]);

    const seen = new Set<string>();
    const out: QuickAddItem[] = [];

    for (const id of favIds) {
      const food = getFood(id);
      if (food && !seen.has(id)) {
        seen.add(id);
        out.push({ food, grams: food.servingGrams, favorite: true });
      }
    }

    for (const r of recents) {
      if (seen.has(r.foodId)) continue;
      const food = getFood(r.foodId);
      if (!food) continue;
      seen.add(r.foodId);
      out.push({ food, grams: r.lastGrams || food.servingGrams, favorite: false });
      if (out.length >= limit) break;
    }

    setItems(out);
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload, revision]);

  return { items, reload };
}
