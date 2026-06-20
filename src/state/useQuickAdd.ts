// =============================================================================
// useQuickAdd — Suggested foods for one-tap logging
// =============================================================================
// Combines favorited foods with recently-logged foods into a single list,
// favorites first, deduplicated, capped at `limit`. Used by the Home screen
// to populate the "Quick add" horizontal strip.
//
// Reloads whenever the diary revision bumps, so a freshly-logged food appears
// in the strip immediately, and removing the last log of a food drops it.

import { useCallback, useEffect, useState } from 'react';

import { getRecentFoods } from '../db/stats';
import { getFavoriteIds } from '../db/favorites';
import { getFood, refreshCustomFoods } from '../data/catalog';
import type { FoodItem } from '../data/foods';
import { useDiaryRevision } from './useDiary';

/**
 * One row of the Quick Add strip. `grams` is the suggested portion (last logged
 * amount, or the food's default serving). `favorite` tags rows that came from
 * the favorites list — used in the UI to show the star icon.
 */
export interface QuickAddItem {
  food: FoodItem;
  grams: number;
  favorite: boolean; // from favorites vs recents
}

/**
 * Returns suggested foods for one-tap logging. Favorites first (in their
 * stored order), then recents until `limit` is reached. Deduplicates by food
 * id so a favorited+recent food appears only once.
 */
export function useQuickAdd(limit = 10): { items: QuickAddItem[]; reload: () => Promise<void> } {
  const revision = useDiaryRevision((s) => s.revision);
  const [items, setItems] = useState<QuickAddItem[]>([]);

  const reload = useCallback(async () => {
    // Ensure custom foods are in the in-memory catalog before resolving ids.
    await refreshCustomFoods();
    const [favIds, recents] = await Promise.all([getFavoriteIds(), getRecentFoods(limit)]);

    const seen = new Set<string>();
    const out: QuickAddItem[] = [];

    // Favorites first, in user-defined order.
    for (const id of favIds) {
      const food = getFood(id);
      if (food && !seen.has(id)) {
        seen.add(id);
        out.push({ food, grams: food.servingGrams, favorite: true });
      }
    }

    // Fill the remainder with recents. A recent that's already in favorites
    // is skipped — the favorites entry wins (with its default serving size).
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
