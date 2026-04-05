'use client';

import { usePathname } from 'next/navigation';
import type { NavItem } from '@/config/navigation';
import { routes, isChildRoute } from '@/config/routes';
import type { Notification } from '@/components/notifications/notification-item';
import { BottomNav } from './bottom-nav';
import { HeaderBar } from './header-bar';
import { SidebarNav } from './sidebar-nav';
import { PageTransitionWrapper } from './page-transition-wrapper';

import { cn } from '@/lib/utils';

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
  /** When true, the sidebar shows expandable admin sub-navigation. */
  isAdmin?: boolean;
}

export function AppShell({
  children,
  navItems,
  user,
  notifications,
  unreadNotificationCount,
  banner,
  isAdmin = false,
}: AppShellProps) {
  const pathname = usePathname();
  const isHome = pathname === routes.home;
  const isChild = isChildRoute(pathname);
  const isManage = pathname === routes.manage || pathname.startsWith(`${routes.manage}/`);

  return (
    <div className="flex min-h-screen flex-col md:bg-surface-page">
      <HeaderBar
        userName={user.name}
        userEmail={user.email}
        userInitials={user.initials}
        avatarUrl={user.avatarUrl}
        notifications={notifications ?? []}
        unreadNotificationCount={unreadNotificationCount ?? 0}
      />

      <div className="flex flex-1 md:flex-row md:gap-3 md:p-3">
        <SidebarNav items={navItems} isAdmin={isAdmin} />

        <div className="flex min-h-0 flex-1 flex-col overflow-x-clip">
          {isHome && banner && (
            <div className="overflow-clip md:rounded-lg md:shadow-(--card-shadow)">{banner}</div>
          )}

          <main
            className={cn(
              'mx-auto flex w-full min-w-0 flex-1 flex-col md:pb-0',
              isManage && isAdmin && !isChild ? 'max-w-400' : 'max-w-3xl',
              isChild ? 'pb-0' : 'pb-20',
            )}
          >
            <PageTransitionWrapper>{children}</PageTransitionWrapper>
          </main>

          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-(--bar-fade-height) bg-linear-to-t from-surface-page to-transparent md:hidden" />
          {!isChild && <BottomNav items={navItems} />}
        </div>
      </div>
    </div>
  );
}
