"use client";

import type { NavItem } from "@/config/navigation";
import { BottomNav } from "./bottom-nav";
import { SidebarNav } from "./sidebar-nav";

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  appName: string;
}

/**
 * Main app layout shell.
 * Sidebar on desktop, bottom tabs on mobile.
 * All content and config received via props.
 */
export function AppShell({ children, navItems, appName }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav items={navItems} appName={appName} />

      <main className="flex flex-1 flex-col pb-16 md:pb-0">
        {children}
      </main>

      <BottomNav items={navItems} />
    </div>
  );
}
