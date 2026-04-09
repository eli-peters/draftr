'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DURATIONS, EASE } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NotificationItem } from '@/components/notifications/notification-item';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/actions';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { formatBadgeCount } from '@/lib/utils';
import type { Notification } from '@/components/notifications/notification-item';

function getNotificationHref(notification: Notification): string | null {
  if (notification.ride_id) return routes.ride(notification.ride_id);
  if (notification.type === 'announcement') return routes.home;
  return null;
}

const { header, notifications: notifContent } = appContent;

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Notification bell icon with popover dropdown.
 * Shows the last 5 notifications. "View All" links to the full page.
 * Both variants are always rendered (CSS visibility) to avoid hydration mismatches.
 */
export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  // Defer Base UI popover to client-only to prevent hydration ID mismatch
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => setMounted(true), []);

  const shouldReduce = useReducedMotion();

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
  }

  async function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
    }
  }

  const displayCount = formatBadgeCount(unreadCount);
  const bellAriaLabel =
    unreadCount > 0 ? header.notificationsBadge(displayCount) : notifContent.heading;

  const bellIcon = (
    <>
      <Bell weight="duotone" className="h-7 w-7" />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key={displayCount}
            aria-hidden="true"
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
            animate={
              shouldReduce
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    scale: 1,
                    transition: { type: 'spring', stiffness: 500, damping: 22 },
                  }
            }
            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
            transition={{ duration: DURATIONS.fast, ease: EASE.out }}
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-badge-notification-bg px-0.5 text-micro font-bold text-badge-notification-text tabular-nums"
          >
            {displayCount}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  const bellClassName =
    'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground transition-colors hover:bg-primary-foreground/15';

  return (
    <>
      {/* Mobile: navigate to notifications page */}
      <Link
        href={routes.notifications}
        className={`${bellClassName} md:hidden`}
        aria-label={bellAriaLabel}
      >
        {bellIcon}
      </Link>

      {/* Desktop: popover with recent notifications (client-only to avoid Base UI hydration ID mismatch) */}
      {mounted && (
        <div className="hidden md:block">
          <Popover>
            <PopoverTrigger
              className={`${bellClassName} cursor-pointer`}
              aria-label={bellAriaLabel}
            >
              <div>{bellIcon}</div>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">{notifContent.heading}</h3>
                {unreadCount > 0 && (
                  <Button variant="muted" size="sm" className="text-xs" onClick={handleMarkAllRead}>
                    {notifContent.markAllRead}
                  </Button>
                )}
              </div>
              <Separator />

              {/* Notification list */}
              {notifications.length > 0 ? (
                <div className="max-h-80 overflow-y-auto py-1">
                  {notifications.map((notification) => {
                    const href = getNotificationHref(notification);

                    return (
                      <div key={notification.id}>
                        {href ? (
                          <Link
                            href={href}
                            className="block cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <NotificationItem notification={notification} compact />
                          </Link>
                        ) : (
                          <div
                            className="cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <NotificationItem notification={notification} compact />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">{header.noNotifications}</p>
                </div>
              )}

              <Separator />

              {/* View all link */}
              <div className="p-2">
                <Link
                  href={routes.notifications}
                  className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  {header.viewAllNotifications}
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </>
  );
}
