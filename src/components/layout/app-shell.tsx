'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/config/navigation';
import { routes, isChildRoute } from '@/config/routes';
import { BottomNav } from './bottom-nav';
import { HeaderBar } from './header-bar';
import { SidebarNav } from './sidebar-nav';
import { PageTransitionWrapper } from './page-transition-wrapper';

import { cn } from '@/lib/utils';

interface AppShellUser {
  name: string;
  initials: string;
  avatarUrl: string | null;
}

interface AppShellProps {
  children: ReactNode;
  navItems: NavItem[];
  user: AppShellUser;
  /** Streaming slot — pass a Suspense-wrapped NotificationsLoader from the layout. */
  notificationsSlot: ReactNode;
  banner?: ReactNode;
  /** When true, the sidebar shows expandable admin sub-navigation. */
  isAdmin?: boolean;
  /** User's role label for the avatar menu. */
  userRole?: string;
}

export function AppShell({
  children,
  navItems,
  user,
  notificationsSlot,
  banner,
  isAdmin = false,
  userRole = 'rider',
}: AppShellProps) {
  const pathname = usePathname();
  const isHome = pathname === routes.home;
  const isChild = isChildRoute(pathname);
  const isManage = pathname === routes.manage || pathname.startsWith(`${routes.manage}/`);
  const isManageSection =
    isManage &&
    (
      [
        routes.manage,
        routes.manageRides,
        routes.manageMembers,
        routes.manageAnnouncements,
        routes.manageSettings,
      ] as string[]
    ).includes(pathname);

  return (
    <div className="flex min-h-screen flex-col md:bg-surface-page">
      <HeaderBar
        userName={user.name}
        userInitials={user.initials}
        avatarUrl={user.avatarUrl}
        notificationsSlot={notificationsSlot}
        isAdmin={isAdmin}
        userRole={userRole}
      />

      <div className="flex flex-1 overflow-x-clip md:flex-row md:gap-3 md:p-3">
        <SidebarNav items={navItems} isAdmin={isAdmin} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {isHome && banner && (
            <div className="overflow-clip md:rounded-lg md:shadow-(--card-shadow)">{banner}</div>
          )}

          <main
            className={cn(
              'mx-auto flex w-full min-w-0 flex-1 flex-col',
              isManageSection ? 'max-w-400' : 'max-w-3xl',
            )}
          >
            <PageTransitionWrapper>{children}</PageTransitionWrapper>
          </main>

          {(!isChild || isManageSection) && (
            <>
              <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-(--bar-fade-height) bg-linear-to-t from-surface-page to-transparent md:hidden" />
              <BottomNav items={navItems} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
