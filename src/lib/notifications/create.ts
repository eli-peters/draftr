import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateNotifications } from '@/lib/cache-tags';
import { readNotificationPreferences } from '@/types/notification-preferences';
import type { NotificationType } from '@/components/notifications/notification-item';

export type NotificationChannel = 'push' | 'email' | 'both';
export type NotificationPriority = 'urgent' | 'normal' | 'low';

/**
 * Canonical event priority taxonomy. Single source of truth — any caller that
 * adds a new notification type must map it here. Priority drives badge colour
 * and (future) sort-order treatment.
 */
export const NOTIFICATION_PRIORITY: Record<NotificationType, NotificationPriority> = {
  ride_cancelled: 'urgent',
  rider_removed: 'urgent',
  weather_watch: 'urgent',
  leader_promoted: 'urgent',
  waitlist_promoted: 'normal',
  ride_update: 'normal',
  new_ride: 'normal',
  announcement: 'normal',
  signup_confirmed: 'low',
  waitlist_joined: 'low',
};

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  rideId?: string | null;
  /** Delivery channel. `both` means in-app + email; email is suppressed if the user opted out. */
  channel?: NotificationChannel;
}

/**
 * Resolve the effective delivery channel by applying the user's preferences.
 *
 * The in-app row is always inserted — that's what drives the bell/list — but
 * the `channel` stored on the row dictates whether the email leg fires. Users
 * who opt out of email downgrade `both` → `push`. A pure `email` request is
 * never downgraded to skip the row entirely: we still want in-app presence.
 */
function applyChannelPreferences(
  requested: NotificationChannel,
  prefs: ReturnType<typeof readNotificationPreferences>,
): NotificationChannel {
  if (requested === 'both' && !prefs.channels.email) return 'push';
  if (requested === 'email' && !prefs.channels.email) return 'push';
  return requested;
}

/**
 * Canonical insertion point for notifications.
 *
 * Handles priority assignment, preference-aware channel downgrade, admin-
 * client insert (RLS blocks rider-initiated inserts), and cache invalidation.
 * Errors are logged, not thrown — matches the existing fire-and-forget pattern
 * at every call site.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const { userId, type, title, body = null, rideId = null, channel = 'push' } = input;
  const admin = createAdminClient();

  const { data: user, error: prefsError } = await admin
    .from('users')
    .select('notification_preferences')
    .eq('id', userId)
    .maybeSingle();

  if (prefsError?.message) {
    console.error('Failed to read notification preferences:', prefsError.message);
  }

  const prefs = readNotificationPreferences(user?.notification_preferences);
  const effectiveChannel = applyChannelPreferences(channel, prefs);

  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    ride_id: rideId,
    channel: effectiveChannel,
    priority: NOTIFICATION_PRIORITY[type],
  });

  if (error?.message) {
    console.error('Failed to create notification:', type, error.message);
    return;
  }

  invalidateNotifications(userId);
}

/**
 * Batch variant — one DB round-trip per distinct user to fetch prefs, one
 * bulk insert. Used by fan-out events (new ride posted, ride updated, ride
 * cancelled, announcement) where we notify many users at once.
 */
export async function createNotifications(
  inputs: readonly CreateNotificationInput[],
): Promise<void> {
  if (inputs.length === 0) return;
  const admin = createAdminClient();

  const uniqueUserIds = [...new Set(inputs.map((i) => i.userId))];
  const { data: users } = await admin
    .from('users')
    .select('id, notification_preferences')
    .in('id', uniqueUserIds);

  const prefsByUser = new Map<string, ReturnType<typeof readNotificationPreferences>>();
  for (const u of users ?? []) {
    prefsByUser.set(u.id, readNotificationPreferences(u.notification_preferences));
  }

  const rows = inputs.map((i) => {
    const channel = i.channel ?? 'push';
    const prefs = prefsByUser.get(i.userId);
    const effectiveChannel = prefs ? applyChannelPreferences(channel, prefs) : channel;
    return {
      user_id: i.userId,
      type: i.type,
      title: i.title,
      body: i.body ?? null,
      ride_id: i.rideId ?? null,
      channel: effectiveChannel,
      priority: NOTIFICATION_PRIORITY[i.type],
    };
  });

  const { error } = await admin.from('notifications').insert(rows);
  if (error?.message) {
    console.error('Failed to create notifications (batch):', error.message);
    return;
  }

  for (const userId of uniqueUserIds) {
    invalidateNotifications(userId);
  }
}
