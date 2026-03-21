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
  appName: string;
  user: AppShellUser;
  notifications?: Notification[];
  unreadNotificationCount?: number;
  banner?: React.ReactNode;
}

export function AppShell({
  children,
  navItems,
  appName,
  user,
  notifications,
  unreadNotificationCount,
  banner,
}: AppShellProps) {
  const pathname = usePathname();
  const isHome = pathname === routes.home;

  return (
    <div className="min-h-screen md:flex">
      <SidebarNav items={navItems} appName={appName} />

      <div className="flex min-h-screen flex-1 flex-col">
        <HeaderBar
          userName={user.name}
          userEmail={user.email}
          userInitials={user.initials}
          avatarUrl={user.avatarUrl}
          notifications={notifications ?? []}
          unreadNotificationCount={unreadNotificationCount ?? 0}
        />

        {isHome && banner}

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-20 md:pb-0">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </main>

        <BottomNav items={navItems} />
      </div>
    </div>
  );
}
