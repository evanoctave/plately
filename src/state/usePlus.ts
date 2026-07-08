// =============================================================================
// usePlus — EvoEat+ subscription entitlement
// =============================================================================
// Thin wrapper over the settings store's `plusActive` flag. UI code reads the
// entitlement through here, never the raw flag.
//
// Source of truth: the RevenueCat `plus` entitlement. src/iap/purchases mirrors
// CustomerInfo into `plusActive` on launch, on purchase, and on restore. The
// `unlock`/`lock` setters remain for guest/dev paths (e.g. the __DEV__ local
// unlock on the Plus screen); real subscribers are driven by the store.

import { useSettings } from './useSettings';

/**
 * EvoEat+ entitlement. The free core of the app never reads this — only the
 * optional "extras" (Fasting, Goal Phases, Coach, Meal Planner) gate on it.
 */
export interface PlusEntitlement {
  active: boolean;
  unlock: () => void;
  lock: () => void;
}

export function usePlus(): PlusEntitlement {
  const active = useSettings((s) => s.plusActive);
  const setPlusActive = useSettings((s) => s.setPlusActive);
  return {
    active,
    unlock: () => setPlusActive(true),
    lock: () => setPlusActive(false),
  };
}

/** Non-hook read, for use outside React (guards in async flows). */
export function isPlusActive(): boolean {
  return useSettings.getState().plusActive;
}
