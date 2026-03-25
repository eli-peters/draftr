'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { NavItem } from '@/config/navigation';
import { routes } from '@/config/routes';
import type { Notification } from '@/components/notifications/notification-item';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { BottomNav } from './bottom-nav';
import { HeaderBar } from './header-bar';
import { SidebarNav } from './sidebar-nav';
import { PageTransitionWrapper } from './page-transition-wrapper';
import { PullToRefreshIndicator } from './pull-to-refresh-indicator';

const MIN_SPINNER_MS = 300;

interface AppShellUser {
  name: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
}

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  user: AppShellUser;
  notifications?: Notification[];
  unreadNotificationCount?: number;
  banner?: React.ReactNode;
}

export function AppShell({
  children,
  navItems,
  user,
  notifications,
  unreadNotificationCount,
  banner,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === routes.home;
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();

  const handleRefresh = useCallback(async () => {
    const start = Date.now();
    await new Promise<void>((resolve) => {
      startTransition(() => {
        router.refresh();
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_SPINNER_MS - elapsed);
        setTimeout(resolve, remaining);
      });
    });
  }, [router]);

  const { pullDistance, state } = usePullToRefresh({
    onRefresh: handleRefresh,
    isEnabled: isMobile,
  });

  const isActive = pullDistance > 0 || state === 'refreshing';

  return (
    <div className="relative flex min-h-screen flex-col md:bg-surface-page">
      {isMobile && <PullToRefreshIndicator pullDistance={pullDistance} state={state} />}

      <div
        style={{
          transform: isActive ? `translateY(${pullDistance}px)` : undefined,
          transition: state === 'idle' ? 'transform 200ms ease-out' : undefined,
        }}
      >
        <HeaderBar
          userName={user.name}
          userEmail={user.email}
          userInitials={user.initials}
          avatarUrl={user.avatarUrl}
          notifications={notifications ?? []}
          unreadNotificationCount={unreadNotificationCount ?? 0}
        />

        <div className="flex flex-1 md:flex-row md:gap-3 md:px-3 md:pb-3">
          <SidebarNav items={navItems} />

          <div className="flex min-h-0 flex-1 flex-col">
            {isHome && banner && (
              <div className="md:px-6 md:pt-3">
                <div className="overflow-hidden md:rounded-lg md:border md:border-border">
                  {banner}
                </div>
              </div>
            )}

            <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-20 md:pb-0">
              <PageTransitionWrapper>{children}</PageTransitionWrapper>
            </main>

            <BottomNav items={navItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
