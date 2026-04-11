'use server';

import { createClient, getUser } from '@/lib/supabase/server';
import { invalidateNotifications } from '@/lib/cache-tags';
import { appContent } from '@/content/app';

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: appContent.common.notAuthenticated };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  invalidateNotifications(user.id);
  return { success: true };
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: appContent.common.notAuthenticated };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { error: error.message };

  invalidateNotifications(user.id);
  return { success: true };
}
