'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  CloudRain,
  CalendarCheck,
  CalendarPlus,
  XCircle,
  ArrowCircleUp,
  Megaphone,
  Info,
  Hourglass,
  UserMinus,
} from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';

export type NotificationType = keyof typeof appContent.notifications.types;
export type NotificationPriority = 'urgent' | 'normal' | 'low';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  ride_id: string | null;
  is_read: boolean;
  priority: NotificationPriority;
  sent_at: string;
}

export const notificationIcons: Record<NotificationType, React.ElementType> = {
  ride_update: Info,
  new_ride: CalendarPlus,
  ride_cancelled: XCircle,
  weather_watch: CloudRain,
  signup_confirmed: CalendarCheck,
  waitlist_promoted: ArrowCircleUp,
  waitlist_joined: Hourglass,
  announcement: Megaphone,
  rider_removed: UserMinus,
  leader_promoted: ArrowCircleUp,
};

const notificationAccent: Record<NotificationType, string> = {
  ride_update: 'text-muted-foreground',
  new_ride: 'text-success',
  ride_cancelled: 'text-destructive',
  weather_watch: 'text-warning',
  signup_confirmed: 'text-success',
  waitlist_promoted: 'text-success',
  waitlist_joined: 'text-muted-foreground',
  announcement: 'text-muted-foreground',
  rider_removed: 'text-destructive',
  leader_promoted: 'text-success',
};

interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
}

/**
 * Shared notification item used in both the full page and the header popover.
 * `compact` reduces padding + title size and hides the body.
 */
export function NotificationItem({ notification, compact }: NotificationItemProps) {
  const Icon = notificationIcons[notification.type];
  const accent = notificationAccent[notification.type];
  const timeAgo = formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true });

  return (
    <div className={cn('flex items-start gap-3', compact && 'px-3 py-2.5')}>
      <Icon
        weight="fill"
        aria-hidden="true"
        className={cn('mt-0.5 shrink-0', compact ? 'size-4' : 'size-5', accent)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3
            className={cn(
              'min-w-0 flex-1 font-normal leading-snug text-foreground',
              compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2',
            )}
          >
            {notification.title}
          </h3>
          {!notification.is_read && (
            <span
              aria-hidden="true"
              className={cn(
                'mt-1.5 shrink-0 rounded-full bg-badge-notification-bg',
                compact ? 'size-1.5' : 'size-2',
              )}
            />
          )}
        </div>
        {!compact && notification.body && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className={cn('text-xs text-muted-foreground', compact ? 'mt-1' : 'mt-2')}>{timeAgo}</p>
      </div>
    </div>
  );
}
