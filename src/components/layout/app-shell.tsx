'use client';

import { usePathname } from 'next/navigation';
import type { NavItem } from '@/config/navigation';
import { routes } from '@/config/routes';
import type { Notification } from '@/components/notifications/notification-item';
import { BottomNav } from './bottom-nav';
import { HeaderBar } from './header-bar';
import { SidebarNav } from './sidebar-nav';
import { PageTransitionWrapper } from './page-transition-wrapper';

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
  const isHome = pathname === routes.home;

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
        <SidebarNav items={navItems} />

        <div className="flex min-h-0 flex-1 flex-col">
          {isHome && banner && (
            <div className="overflow-hidden md:rounded-lg md:border md:border-border">{banner}</div>
          )}

          <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-20 md:pb-0">
            <PageTransitionWrapper>{children}</PageTransitionWrapper>
          </main>

          <BottomNav items={navItems} />
        </div>
      </div>
    </div>
  );
}
