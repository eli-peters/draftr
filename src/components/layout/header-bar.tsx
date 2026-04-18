'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { AvatarMenu } from './avatar-menu';
import { AppLogo } from './app-logo';
import { routes, isChildRoute, getParentRoute } from '@/config/routes';
import { getParentRouteLabel } from '@/config/navigation';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useNavigationOrigin } from '@/components/navigation-origin-provider';

interface HeaderBarProps {
  userName: string;
  userInitials: string;
  avatarUrl: string | null;
  /** Streaming slot — pass a Suspense-wrapped NotificationsLoader from the layout. */
  notificationsSlot: ReactNode;
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
  userInitials,
  avatarUrl,
  notificationsSlot,
  isAdmin = false,
  userRole = 'rider',
}: HeaderBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { hasReferrer } = useNavigationOrigin();
  const isChild = isChildRoute(pathname);
  const showBackNav = isMobile && isChild;
  const parentRoute = getParentRoute(pathname);
  const parentLabel = getParentRouteLabel(parentRoute, isAdmin);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-(--border-subtle) bg-(--surface-default)/70 px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 backdrop-blur-(--bar-backdrop-blur) backdrop-saturate-(--bar-backdrop-saturate) md:px-8 dark:bg-(--surface-default)/55">
      {/* Left: back arrow on child pages (mobile), logo on parent pages */}
      {showBackNav ? (
        hasReferrer ? (
          <button
            onClick={() => router.back()}
            aria-label={`Navigate back to ${parentLabel}`}
            className="flex items-center text-foreground"
          >
            <CaretLeft className="size-6" />
          </button>
        ) : (
          <Link
            href={parentRoute}
            aria-label={`Navigate back to ${parentLabel}`}
            className="flex items-center text-foreground"
          >
            <CaretLeft className="size-6" />
          </Link>
        )
      ) : (
        <Link href={routes.home} className="flex items-center gap-2">
          <AppLogo className="h-5 w-auto text-primary" />
        </Link>
      )}

      {/* Right: notification bell (streaming slot) + avatar */}
      <div className="flex items-center gap-3">
        {notificationsSlot}
        <AvatarMenu
          userName={userName}
          userInitials={userInitials}
          avatarUrl={avatarUrl}
          userRole={userRole}
        />
      </div>
    </header>
  );
}
