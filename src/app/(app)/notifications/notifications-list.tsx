'use client';

import Link from 'next/link';
import { isToday, isYesterday, isThisWeek, format } from 'date-fns';
import { BellSimple } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { cn, formatBadgeCount } from '@/lib/utils';
import { NotificationItem } from '@/components/notifications/notification-item';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/actions';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { Notification } from '@/components/notifications/notification-item';

function groupByDay(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const buckets = new Map<string, Notification[]>();
  for (const n of notifications) {
    const date = new Date(n.sent_at);
    let key: string;
    if (isToday(date)) key = 'Today';
    else if (isYesterday(date)) key = 'Yesterday';
    else if (isThisWeek(date)) key = 'Earlier this week';
    else key = format(date, 'MMMM');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(n);
  }
  return Array.from(buckets.entries()).map(([label, items]) => ({ label, items }));
}

function getNotificationHref(notification: Notification): string | null {
  if (notification.ride_id) return routes.ride(notification.ride_id);
  if (notification.type === 'announcement') return routes.home;
  return null;
}

interface NotificationsListProps {
  notifications: Notification[];
  heading: string;
  markAllReadLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function NotificationsList({
  notifications,
  heading,
  markAllReadLabel,
  emptyTitle,
  emptyDescription,
}: NotificationsListProps) {
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayCount = formatBadgeCount(unreadCount);

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
  }

  return (
    <>
      <PageHeader
        title={heading}
        badge={
          unreadCount > 0 ? (
            <span
              aria-label={appContent.notifications.badge.ariaLabel(displayCount)}
              className="flex h-6 min-w-6 items-center justify-center rounded-full bg-badge-notification-bg px-2 text-sm font-bold text-badge-notification-text tabular-nums"
            >
              {displayCount}
            </span>
          ) : undefined
        }
        actions={
          unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground"
              onClick={handleMarkAllRead}
            >
              {markAllReadLabel}
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={BellSimple}
          className="mt-12 flex-1"
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groupByDay(notifications).map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <SectionHeading as="h2" className="px-1">
                {group.label}
              </SectionHeading>
              <div className="flex flex-col gap-2">
                {group.items.map((notification) => {
                  const content = (
                    <Card
                      className={cn(
                        'relative p-5 pl-6 transition-opacity',
                        notification.is_read
                          ? 'opacity-muted'
                          : 'cursor-pointer before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full before:bg-(--badge-notification-bg)',
                      )}
                      onClick={
                        !notification.is_read ? () => handleMarkRead(notification.id) : undefined
                      }
                    >
                      <NotificationItem notification={notification} />
                    </Card>
                  );

                  const href = getNotificationHref(notification);

                  return href ? (
                    <Link key={notification.id} href={href} className="block">
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
