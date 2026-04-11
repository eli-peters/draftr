import { getUserNotifications } from '@/lib/notifications/queries';
import { NotificationBell } from './notification-bell';

interface NotificationsLoaderProps {
  userId: string;
}

/**
 * Async server component — fetches notifications and renders the bell.
 * Placed inside a Suspense boundary in the layout so the app shell renders
 * immediately; the badge count and notification list stream in after.
 */
export async function NotificationsLoader({ userId }: NotificationsLoaderProps) {
  const notifications = await getUserNotifications(userId);
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return <NotificationBell notifications={recentNotifications} unreadCount={unreadCount} />;
}
