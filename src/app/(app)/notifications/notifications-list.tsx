'use client';

import Link from 'next/link';
import { BellSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { cn } from '@/lib/utils';
import { NotificationItem } from '@/components/notifications/notification-item';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/actions';
import { routes } from '@/config/routes';
import type { Notification } from '@/components/notifications/notification-item';

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
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground tabular-nums">
              {unreadCount}
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
        <div className="mt-8 space-y-3">
          {notifications.map((notification) => {
            const content = (
              <Card
                className={cn('p-5', notification.is_read ? 'opacity-disabled' : 'cursor-pointer')}
                onClick={!notification.is_read ? () => handleMarkRead(notification.id) : undefined}
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
      )}
    </>
  );
}
