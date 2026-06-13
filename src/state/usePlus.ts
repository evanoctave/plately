import { useSettings } from './useSettings';

/**
 * Plately+ entitlement. The free core of the app never reads this — only the
 * optional "extras" (Fasting, Goal Phases, Coach, Meal Planner) gate on it.
 *
 * There is no real billing yet, so `unlock`/`lock` flip a local flag with no
 * charge. When StoreKit lands, the purchase flow should call `unlock` on a
 * verified transaction and `lock` on expiry/refund.
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
