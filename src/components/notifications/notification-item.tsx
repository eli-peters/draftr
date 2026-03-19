'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  CloudRain,
  CalendarCheck,
  XCircle,
  ArrowCircleUp,
  Megaphone,
  Info,
} from '@phosphor-icons/react';
import { appContent } from '@/content/app';

export type NotificationType = keyof typeof appContent.notifications.types;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  ride_id: string | null;
  is_read: boolean;
  sent_at: string;
}

export const notificationIcons: Record<NotificationType, React.ElementType> = {
  ride_update: Info,
  ride_cancelled: XCircle,
  weather_watch: CloudRain,
  signup_confirmed: CalendarCheck,
  waitlist_promoted: ArrowCircleUp,
  announcement: Megaphone,
};

export const notificationStyles: Record<NotificationType, string> = {
  ride_update: 'text-primary bg-primary/10',
  ride_cancelled: 'text-destructive bg-destructive/10',
  weather_watch: 'text-warning bg-warning/10',
  signup_confirmed: 'text-success bg-success/10',
  waitlist_promoted: 'text-primary bg-primary/10',
  announcement: 'text-foreground bg-muted',
};

interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
}

/**
 * Shared notification item used in both the full page and the header dropdown.
 * `compact` mode reduces padding and hides the body text for the dropdown.
 */
export function NotificationItem({ notification, compact }: NotificationItemProps) {
  const Icon = notificationIcons[notification.type];
  const iconStyle = notificationStyles[notification.type];
  const timeAgo = formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true });

  return (
    <div
      className={`flex gap-3 transition-all duration-200 ${
        compact ? 'px-3 py-2.5' : ''
      } ${notification.is_read ? 'opacity-muted' : ''}`}
    >
      {/* Icon */}
      <div
        className={`flex ${compact ? 'h-7 w-7' : 'h-10 w-10'} shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
      >
        <Icon weight="fill" className={compact ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`${compact ? 'text-xs' : 'text-sm'} leading-tight ${
              notification.is_read ? 'font-medium text-foreground' : 'font-semibold text-foreground'
            }`}
          >
            {notification.title}
          </h3>
          {!notification.is_read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        {!compact && notification.body && (
          <p className="mt-1 text-compact text-muted-foreground leading-relaxed">
            {notification.body}
          </p>
        )}
        <p
          className={`${compact ? 'mt-1' : 'mt-2'} text-xs font-medium uppercase tracking-wide text-muted-foreground/70`}
        >
          {timeAgo}
        </p>
      </div>
    </div>
  );
}
