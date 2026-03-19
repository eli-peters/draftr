'use client';

import type { NavItem } from '@/config/navigation';
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
}

export function AppShell({
  children,
  navItems,
  appName,
  user,
  notifications,
  unreadNotificationCount,
}: AppShellProps) {
  return (
    <div className="min-h-screen md:flex">
      <SidebarNav items={navItems} appName={appName} />

      <div className="flex min-h-screen flex-1 flex-col">
        <HeaderBar
          appName={appName}
          userName={user.name}
          userEmail={user.email}
          userInitials={user.initials}
          avatarUrl={user.avatarUrl}
          notifications={notifications ?? []}
          unreadNotificationCount={unreadNotificationCount ?? 0}
        />

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-20 md:pb-0">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </main>

        <BottomNav items={navItems} />
      </div>
    </div>
  );
}
