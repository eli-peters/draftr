"use client";

import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import { NotificationBell } from "./notification-bell";
import { AvatarMenu } from "./avatar-menu";
import type { Notification } from "@/components/notifications/notification-item";

interface HeaderBarProps {
  appName: string;
  userName: string;
  userEmail: string;
  userInitials: string;
  avatarUrl: string | null;
  notifications: Notification[];
  unreadNotificationCount: number;
}

/**
 * Sticky top header bar.
 * Team logo left, notification bell + avatar right.
 */
export function HeaderBar({
  appName,
  userName,
  userEmail,
  userInitials,
  avatarUrl,
  notifications,
  unreadNotificationCount,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-5 md:px-8 pt-[env(safe-area-inset-top)]">
      {/* Left: team logo (mobile only — sidebar has brand on desktop) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <UsersThree className="h-4.5 w-4.5 text-primary" />
        </div>
      </div>

      {/* Spacer on desktop to push right items to the end */}
      <div className="hidden md:block" />

      {/* Right: notification bell + avatar */}
      <div className="flex items-center gap-1.5">
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadNotificationCount}
        />
        <AvatarMenu
          userName={userName}
          userEmail={userEmail}
          userInitials={userInitials}
          avatarUrl={avatarUrl}
        />
      </div>
    </header>
  );
}
