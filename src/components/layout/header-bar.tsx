'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CaretLeft } from '@phosphor-icons/react';
import { AvatarMenu } from './avatar-menu';
import { AppLogo } from './app-logo';
import { routes, isChildRoute, getParentRoute } from '@/config/routes';
import { getParentRouteLabel } from '@/config/navigation';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useNavigationOrigin } from '@/components/navigation-origin-provider';
import { cn } from '@/lib/utils';

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
 *
 * On the mobile ride-detail route the header enters transparent mode: the
 * material background and the button pill chrome both fade in sync with the
 * user's scroll. At the top of the page the header is invisible and the
 * back / bell sit on translucent pills; once the user has scrolled past the
 * hero the header returns to the normal opaque state with bare button icons.
 */

const RIDE_DETAIL_PATTERN = /^\/rides\/[^/]+$/;
const PILL_BACKING_CLASS =
  'pointer-events-none absolute inset-0 rounded-full bg-background/70 shadow-sm backdrop-blur';

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
  const transparentMode = isMobile && RIDE_DETAIL_PATTERN.test(pathname);

  const { scrollY } = useScroll();
  // Header material fades in from scrollY 0 → 80; pill chrome fades out from
  // 0 → 40 so the buttons return to bare icons as the backdrop solidifies.
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1], { clamp: true });
  const pillOpacity = useTransform(scrollY, [0, 40], [1, 0], { clamp: true });

  const backLabel = `Navigate back to ${parentLabel}`;
  const backClass = transparentMode
    ? 'relative inline-flex size-10 items-center justify-center rounded-full text-foreground'
    : 'flex items-center text-foreground';
  const backInner = (
    <>
      {transparentMode && (
        <motion.span style={{ opacity: pillOpacity }} className={PILL_BACKING_CLASS} aria-hidden />
      )}
      <CaretLeft className="relative size-6" weight="bold" />
    </>
  );
  const backButton = hasReferrer ? (
    <button onClick={() => router.back()} aria-label={backLabel} className={backClass}>
      {backInner}
    </button>
  ) : (
    <button
      onClick={() => router.replace(parentRoute)}
      aria-label={backLabel}
      className={backClass}
    >
      {backInner}
    </button>
  );

  const bellWrap = transparentMode ? (
    <div className="relative inline-flex">
      <motion.span style={{ opacity: pillOpacity }} className={PILL_BACKING_CLASS} aria-hidden />
      <div className="relative">{notificationsSlot}</div>
    </div>
  ) : (
    notificationsSlot
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        !transparentMode &&
          'material-regular border-b border-(--border-subtle) md:bg-surface-default md:[backdrop-filter:none]',
      )}
    >
      {transparentMode && (
        <motion.div
          style={{ opacity: bgOpacity }}
          className="material-regular pointer-events-none absolute inset-0 border-b border-(--border-subtle)"
          aria-hidden
        />
      )}
      <div className="relative flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 md:px-8">
        {/* Left: back arrow on child pages (mobile), logo on parent pages */}
        {showBackNav ? (
          backButton
        ) : (
          <Link href={routes.home} className="flex items-center gap-2">
            <AppLogo className="h-5 w-auto text-primary" />
          </Link>
        )}

        {/* Right: notification bell (streaming slot) + avatar */}
        <div className="flex items-center gap-3">
          {bellWrap}
          <AvatarMenu
            userName={userName}
            userInitials={userInitials}
            avatarUrl={avatarUrl}
            userRole={userRole}
          />
        </div>
      </div>
    </header>
  );
}
