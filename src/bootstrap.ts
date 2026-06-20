// =============================================================================
// bootstrap — One-time service startup, wired from App.tsx
// =============================================================================
// Kicks off the cross-cutting services that don't belong to any one screen:
//   - the Supabase auth listener (mirrors session → settings, drives sync),
//   - RevenueCat configuration (entitlement → plusActive),
//   - the local reminder schedule (re-applied from saved prefs),
//   - a foreground hook that runs sync when the app returns to the front.
//
// Every piece is fail-soft and no-ops when its keys aren't configured, so the
// app runs fully offline/guest in development. Returns a cleanup function for
// React's effect teardown.

import { AppState, type AppStateStatus } from 'react-native';

import { initAuthListener } from './auth/useAuth';
import { configurePurchases } from './iap/purchases';
import { applyReminderSchedule } from './notifications/notifications';
import { useSettings } from './state/useSettings';

export function bootstrapServices(): () => void {
  initAuthListener();
  void configurePurchases();
  void applyReminderSchedule(useSettings.getState().reminders).catch(() => undefined);

  // Returning to the foreground is a good moment to reconcile with the cloud.
  const onAppStateChange = (status: AppStateStatus): void => {
    if (status === 'active') {
      void import('./sync/engine')
        .then((mod) => mod.runSync())
        .catch(() => undefined);
    }
  };
  const sub = AppState.addEventListener('change', onAppStateChange);

  return () => sub.remove();
}
