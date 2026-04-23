import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateNotifications } from '@/lib/cache-tags';
import type { NotificationType } from '@/components/notifications/notification-item';

export interface RemoveUnreadReversibleInput {
  userId: string;
  type: NotificationType;
  rideId: string;
}

/**
 * Delete unread notifications matching (user, type, ride) — used when the
 * triggering action is reversed (e.g. rider cancels a signup → their
 * `signup_confirmed` notification is stale; the leader's `waitlist_joined`
 * is stale if the rider was waitlisted).
 *
 * Idempotent — if nothing matches or all matches are already read, this is
 * a no-op. Read notifications are preserved so history is never rewritten.
 *
 * Errors are logged, not thrown — consistent with the rest of the
 * notification pipeline.
 */
export async function removeUnreadReversible(input: RemoveUnreadReversibleInput): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from('notifications')
    .delete()
    .eq('user_id', input.userId)
    .eq('type', input.type)
    .eq('ride_id', input.rideId)
    .eq('is_read', false);

  if (error?.message) {
    console.error('Failed to remove reversible notification:', input.type, error.message);
    return;
  }

  invalidateNotifications(input.userId);
}
