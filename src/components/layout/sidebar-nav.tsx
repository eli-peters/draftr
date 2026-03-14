"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/config/navigation";
import { NavIcon } from "./nav-icon";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  items: NavItem[];
  appName: string;
}

/**
 * Desktop sidebar navigation.
 * Hidden on mobile (below md breakpoint).
 * Receives nav items from config — no hardcoded routes.
 */
export function SidebarNav({ items, appName }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-sidebar">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold text-foreground">{appName}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
