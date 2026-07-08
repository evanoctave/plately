// =============================================================================
// iap/purchases — RevenueCat integration for EvoEat+
// =============================================================================
// Wraps react-native-purchases. The `plus` entitlement is the single source of
// truth for the subscription; whenever CustomerInfo changes we mirror its
// active state into the settings store (`plusActive`), which `usePlus` reads.
//
// When RevenueCat isn't configured (no key in .env), `configurePurchases` is a
// no-op and the Plus screen shows a "not available in this build" state.

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';

import { env, isPurchasesConfigured } from '../config/env';
import { useSettings } from '../state/useSettings';

/** RevenueCat entitlement identifier configured in the dashboard. */
export const PLUS_ENTITLEMENT = 'plus';

let configured = false;

function applyCustomerInfo(info: CustomerInfo): void {
  const active = info.entitlements.active[PLUS_ENTITLEMENT] !== undefined;
  useSettings.getState().setPlusActive(active);
}

/** Configure RevenueCat once at startup. Safe to call when unconfigured. */
export function configurePurchases(): void {
  if (configured || !isPurchasesConfigured() || Platform.OS !== 'ios') return;
  configured = true;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: env.revenueCatIosKey as string });
  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  // Pull the current entitlement state on launch so a returning subscriber is
  // unlocked without having to restore manually.
  void Purchases.getCustomerInfo().then(applyCustomerInfo).catch(() => undefined);
}

export function isPurchasesReady(): boolean {
  return configured;
}

/** The current offering (monthly / yearly packages) or null. */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export interface PurchaseResult {
  active: boolean;
  cancelled: boolean;
  error: string | null;
}

/** Purchase a package. Cancellation is reported, not thrown. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (!configured) return { active: false, cancelled: false, error: 'Purchases are not available in this build.' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
    return { active: customerInfo.entitlements.active[PLUS_ENTITLEMENT] !== undefined, cancelled: false, error: null };
  } catch (err) {
    if (err && typeof err === 'object' && 'userCancelled' in err && (err as { userCancelled: boolean }).userCancelled) {
      return { active: false, cancelled: true, error: null };
    }
    const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Purchase failed.';
    return { active: false, cancelled: false, error: msg };
  }
}

/** Restore previous purchases (Apple-required). */
export async function restorePurchases(): Promise<PurchaseResult> {
  if (!configured) return { active: false, cancelled: false, error: 'Purchases are not available in this build.' };
  try {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    return { active: info.entitlements.active[PLUS_ENTITLEMENT] !== undefined, cancelled: false, error: null };
  } catch (err) {
    const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Restore failed.';
    return { active: false, cancelled: false, error: msg };
  }
}
