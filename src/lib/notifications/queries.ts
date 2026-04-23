import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { tagNotifications } from '@/lib/cache-tags';
import type { Notification } from '@/components/notifications/notification-item';

/**
 * Fetch all notifications for a user, ordered by sent_at descending.
 * Cached per user; invalidated via tagNotifications(userId).
 */
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, ride_id, is_read, priority, sent_at')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error?.message) {
        console.error('Error fetching notifications:', error.message, error.code, error.details);
        return [];
      }

      return (data ?? []) as Notification[];
    },
    ['user-notifications', userId],
    { tags: [tagNotifications(userId)], revalidate: 120 },
  )();
}

/**
 * Get the count of unread notifications for a user.
 * Cached per user; invalidated via tagNotifications(userId).
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error?.message) {
        console.error('Error fetching unread count:', error.message, error.code, error.details);
        return 0;
      }

      return count ?? 0;
    },
    ['unread-notification-count', userId],
    { tags: [tagNotifications(userId)], revalidate: 120 },
  )();
}
