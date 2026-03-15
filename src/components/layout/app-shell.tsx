"use client";

import type { NavItem } from "@/config/navigation";
import { BottomNav } from "./bottom-nav";
import { HeaderBar } from "./header-bar";

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
}

export function AppShell({ children, navItems, appName, user }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <HeaderBar
        appName={appName}
        userName={user.name}
        userEmail={user.email}
        userInitials={user.initials}
        avatarUrl={user.avatarUrl}
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-20">
        {children}
      </main>

      <BottomNav items={navItems} />
    </div>
  );
}
