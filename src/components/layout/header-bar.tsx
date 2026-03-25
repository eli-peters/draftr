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
    <header className="sticky top-0 z-40 flex items-center justify-between bg-primary px-5 md:px-8 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
      {/* Left: team logo */}
      <Link href={routes.home} className="flex items-center gap-2">
        <AppLogo className="h-5 w-auto text-primary-foreground" />
      </Link>

      {/* Right: notification bell + avatar */}
      <div className="flex items-center gap-3">
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
