'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { NotificationBell } from './notification-bell';
import { AvatarMenu } from './avatar-menu';
import { AppLogo } from './app-logo';
import { routes, isChildRoute, getParentRoute } from '@/config/routes';
import { getParentRouteLabel } from '@/config/navigation';
import { useIsMobile } from '@/hooks/use-is-mobile';
import type { Notification } from '@/components/notifications/notification-item';

interface HeaderBarProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  avatarUrl: string | null;
  notifications: Notification[];
  unreadNotificationCount: number;
  isAdmin?: boolean;
  userRole?: string;
}

/**
 * Sticky top header bar.
 * Parent pages: team logo left. Child pages (mobile): back arrow + parent page name.
 * Notification bell + avatar always on the right.
 */
export function HeaderBar({
  userName,
  userEmail,
  userInitials,
  avatarUrl,
  notifications,
  unreadNotificationCount,
  isAdmin = false,
  userRole = 'rider',
}: HeaderBarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isChild = isChildRoute(pathname);
  const showBackNav = isMobile && isChild;
  const parentRoute = getParentRoute(pathname);
  const parentLabel = getParentRouteLabel(parentRoute, isAdmin);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-primary px-5 md:px-8 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
      {/* Left: back arrow on child pages (mobile), logo on parent pages */}
      {showBackNav ? (
        <Link
          href={parentRoute}
          aria-label={`Navigate back to ${parentLabel}`}
          className="flex items-center text-primary-foreground"
        >
          <CaretLeft weight="bold" className="size-6" />
        </Link>
      ) : (
        <Link href={routes.home} className="flex items-center gap-2">
          <AppLogo className="h-5 w-auto text-primary-foreground" />
        </Link>
      )}

      {/* Right: notification bell + avatar */}
      <div className="flex items-center gap-3">
        <NotificationBell notifications={notifications} unreadCount={unreadNotificationCount} />
        <AvatarMenu
          userName={userName}
          userEmail={userEmail}
          userInitials={userInitials}
          avatarUrl={avatarUrl}
          userRole={userRole}
        />
      </div>
    </header>
  );
}
