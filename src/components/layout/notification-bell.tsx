"use client";

import Link from "next/link";
import { Bell } from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationItem } from "@/components/notifications/notification-item";
import { markAllNotificationsRead } from "@/lib/notifications/actions";
import { appContent } from "@/content/app";
import type { Notification } from "@/components/notifications/notification-item";

const { header, notifications: notifContent } = appContent;

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Notification bell icon with popover dropdown.
 * Shows the last 5 notifications. "View All" links to the full page.
 */
export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  async function handleMarkAllRead() {
    await markAllNotificationsRead();
  }

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer">
        <div>
          <Bell weight={unreadCount > 0 ? "fill" : "regular"} className="h-6 w-6" />
        </div>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-primary-foreground tabular-nums">
            {unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {notifContent.heading}
          </h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground" onClick={handleMarkAllRead}>
              {notifContent.markAllRead}
            </Button>
          )}
        </div>
        <Separator />

        {/* Notification list */}
        {notifications.length > 0 ? (
          <div className="max-h-80 overflow-y-auto py-1">
            {notifications.map((notification) => (
              <div key={notification.id}>
                {notification.ride_id ? (
                  <Link
                    href={`/rides/${notification.ride_id}`}
                    className="block cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <NotificationItem notification={notification} compact />
                  </Link>
                ) : (
                  <div className="cursor-pointer transition-colors hover:bg-muted/50">
                    <NotificationItem notification={notification} compact />
                  </div>
                )}
              </div>
            ))}
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
            href="/notifications"
            className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            {header.viewAllNotifications}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
