"use client";

import { formatDistanceToNow } from "date-fns";
import {
  CloudRain,
  CalendarCheck,
  XCircle,
  ArrowCircleUp,
  Megaphone,
  Info,
} from "@phosphor-icons/react";
import { appContent } from "@/content/app";

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
  ride_update: "text-primary bg-primary/10",
  ride_cancelled: "text-destructive bg-destructive/10",
  weather_watch: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  signup_confirmed: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30",
  waitlist_promoted: "text-primary bg-primary/10",
  announcement: "text-foreground bg-muted",
};

/**
 * Mock data — will be replaced with real queries.
 */
export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "signup_confirmed",
    title: "You're signed up for Saturday Morning Social",
    body: "March 21 at 7:30 AM — Canary District. See you there!",
    ride_id: "1",
    is_read: false,
    sent_at: "2026-03-14T18:30:00Z",
  },
  {
    id: "2",
    type: "weather_watch",
    title: "Weather Watch: Sunday Humber River Loop",
    body: "Rain is forecast for Sunday morning. We'll update by Saturday 8 PM.",
    ride_id: "2",
    is_read: false,
    sent_at: "2026-03-14T15:00:00Z",
  },
  {
    id: "3",
    type: "waitlist_promoted",
    title: "You're in! High Park Hills",
    body: "A spot opened up and you've been moved from the waitlist. You're now confirmed.",
    ride_id: "5",
    is_read: false,
    sent_at: "2026-03-13T12:00:00Z",
  },
  {
    id: "4",
    type: "ride_cancelled",
    title: "Ride Cancelled: Midweek Tempo",
    body: "Wednesday's tempo ride has been cancelled due to freezing rain.",
    ride_id: "7",
    is_read: true,
    sent_at: "2026-03-12T09:00:00Z",
  },
  {
    id: "5",
    type: "announcement",
    title: "Spring season kickoff party!",
    body: "Join us Saturday March 28 at the Canary District for the 2026 season launch. Bikes welcome.",
    ride_id: null,
    is_read: true,
    sent_at: "2026-03-11T10:00:00Z",
  },
  {
    id: "6",
    type: "ride_update",
    title: "Route changed: Scarborough Bluffs Ride",
    body: "The route has been updated to avoid construction on Kingston Road. Check the new route link.",
    ride_id: "6",
    is_read: true,
    sent_at: "2026-03-10T14:00:00Z",
  },
];

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
        compact ? "px-3 py-2.5" : ""
      } ${notification.is_read ? "opacity-50" : ""}`}
    >
      {/* Icon */}
      <div className={`flex ${compact ? "h-7 w-7" : "h-10 w-10"} shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
        <Icon weight="fill" className={compact ? "h-3.5 w-3.5" : "h-4.5 w-4.5"} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`${compact ? "text-xs" : "text-sm"} leading-tight ${
              notification.is_read ? "font-medium text-foreground" : "font-semibold text-foreground"
            }`}
          >
            {notification.title}
          </h3>
          {!notification.is_read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        {!compact && notification.body && (
          <p className="mt-1 text-[0.8rem] text-muted-foreground leading-relaxed">
            {notification.body}
          </p>
        )}
        <p className={`${compact ? "mt-1" : "mt-2"} text-xs font-medium uppercase tracking-wide text-muted-foreground/70`}>
          {timeAgo}
        </p>
      </div>
    </div>
  );
}
