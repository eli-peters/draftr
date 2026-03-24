'use client';

import Link from 'next/link';
import { NotificationBell } from './notification-bell';
import { AvatarMenu } from './avatar-menu';
import { AppLogo } from './app-logo';
import { routes } from '@/config/routes';
import type { Notification } from '@/components/notifications/notification-item';

interface HeaderBarProps {
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
  userName,
  userEmail,
  userInitials,
  avatarUrl,
  notifications,
  unreadNotificationCount,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface-default px-5 md:px-8 pt-[env(safe-area-inset-top)]">
      {/* Left: team logo (mobile only — sidebar has brand on desktop) */}
      <Link href={routes.home} className="flex items-center gap-2 md:hidden">
        <AppLogo className="h-5 w-auto text-primary" />
      </Link>

      {/* Spacer on desktop to push right items to the end */}
      <div className="hidden md:block" />

      {/* Right: notification bell + avatar */}
      <div className="flex items-center gap-1.5">
        <NotificationBell notifications={notifications} unreadCount={unreadNotificationCount} />
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
