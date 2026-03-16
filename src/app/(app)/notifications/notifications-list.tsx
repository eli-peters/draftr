"use client";

import Link from "next/link";
import { BellSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/notification-item";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/notifications/actions";
import type { Notification } from "@/components/notifications/notification-item";

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{heading}</h1>
          {unreadCount > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-sm text-muted-foreground" onClick={handleMarkAllRead}>
            {markAllReadLabel}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <BellSimple weight="duotone" className="h-10 w-10 text-primary/60" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">{emptyTitle}</p>
          <p className="mt-2 text-base text-muted-foreground max-w-80">{emptyDescription}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map((notification) => {
            const content = (
              <div
                className={`rounded-xl border border-border bg-card p-5 ${
                  notification.is_read ? "opacity-40" : "cursor-pointer"
                }`}
                onClick={!notification.is_read ? () => handleMarkRead(notification.id) : undefined}
              >
                <NotificationItem notification={notification} />
              </div>
            );

            return notification.ride_id ? (
              <Link key={notification.id} href={`/rides/${notification.ride_id}`} className="block">
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
