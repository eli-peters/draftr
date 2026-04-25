'use client';

import Link from 'next/link';
import { isToday, isYesterday, isThisWeek, format } from 'date-fns';
import { BellSimple } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { NotificationItem } from '@/components/notifications/notification-item';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/actions';
import { routes } from '@/config/routes';
import { cn } from '@/lib/utils';
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

const rowBase = '-mx-5 block px-5 py-3 transition-colors hover:bg-muted/40 md:-mx-6 md:px-6';
const rowUnread = 'bg-(--badge-notification-bg)/[0.04]';

export function NotificationsList({
  notifications,
  heading,
  markAllReadLabel,
  emptyTitle,
  emptyDescription,
}: NotificationsListProps) {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
        className="items-center"
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
          icon={<BellSimple weight="duotone" />}
          className="mt-12 flex-1"
        />
      ) : (
        <div className="flex flex-col gap-card-stack">
          {groupByDay(notifications).map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <SectionHeading as="h2" className="px-1">
                {group.label}
              </SectionHeading>
              <div className="flex flex-col">
                {group.items.map((notification) => {
                  const href = getNotificationHref(notification);
                  const unread = !notification.is_read;
                  const rowClass = cn(rowBase, unread && rowUnread);
                  const onClick = unread ? () => handleMarkRead(notification.id) : undefined;

                  if (href) {
                    return (
                      <Link
                        key={notification.id}
                        href={href}
                        className={rowClass}
                        onClick={onClick}
                      >
                        <NotificationItem notification={notification} />
                      </Link>
                    );
                  }

                  if (unread) {
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        className={cn(rowClass, 'w-full text-left')}
                        onClick={onClick}
                      >
                        <NotificationItem notification={notification} />
                      </button>
                    );
                  }

                  return (
                    <div key={notification.id} className={rowClass}>
                      <NotificationItem notification={notification} />
                    </div>
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
