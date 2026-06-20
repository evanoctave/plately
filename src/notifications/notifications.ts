// =============================================================================
// notifications/notifications — Local reminder scheduling (expo-notifications)
// =============================================================================
// All reminders are LOCAL daily repeating notifications — no push server / APNs.
// `applyReminderSchedule` is the single entry point: it requests permission if
// needed, clears any previously scheduled reminders, and re-registers the set
// computed by buildSchedule(). Called after onboarding and whenever the user
// changes reminder settings.

import * as Notifications from 'expo-notifications';

import { buildSchedule, type ReminderPrefs } from './schedule';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Ask for notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain && current.status === 'denied') return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

/**
 * Reconcile scheduled notifications with the given prefs. Cancels all existing
 * reminders, then schedules the new set. If prefs are disabled or permission is
 * refused, the result is simply no scheduled reminders.
 */
export async function applyReminderSchedule(prefs: ReminderPrefs): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const reminders = buildSchedule(prefs);
  if (reminders.length === 0) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  for (const r of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.key,
      content: { title: r.title, body: r.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: r.hour,
        minute: r.minute,
      },
    });
  }
}

/** Cancel every scheduled reminder (e.g. user toggles notifications off). */
export async function clearReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
