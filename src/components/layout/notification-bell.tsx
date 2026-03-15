"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell } from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  NotificationItem,
  mockNotifications,
} from "@/components/notifications/notification-item";
import { appContent } from "@/content/app";

const { header, notifications: notifContent } = appContent;

/**
 * Notification bell icon with popover dropdown.
 * Shows the last 5 notifications. "View All" links to the full page.
 */
export function NotificationBell() {
  const notifications = mockNotifications;
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer">
        <motion.div
          animate={unreadCount > 0 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Bell weight={unreadCount > 0 ? "fill" : "regular"} className="h-6 w-6" />
        </motion.div>
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
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground">
              {notifContent.markAllRead}
            </Button>
          )}
        </div>
        <Separator />

        {/* Notification list */}
        {recentNotifications.length > 0 ? (
          <div className="max-h-80 overflow-y-auto py-1">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
              >
                <NotificationItem notification={notification} compact />
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
