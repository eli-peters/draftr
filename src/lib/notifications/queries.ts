import { createClient } from '@/lib/supabase/server';
import type { Notification } from '@/components/notifications/notification-item';

/**
 * Fetch all notifications for a user, ordered by sent_at descending.
 */
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, ride_id, is_read, sent_at')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(50);

  if (error?.message) {
    console.error('Error fetching notifications:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []) as Notification[];
}

/**
 * Get the count of unread notifications for a user.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();

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
}
