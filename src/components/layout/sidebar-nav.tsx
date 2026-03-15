"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { NavItem } from "@/config/navigation";
import { NavIcon } from "./nav-icon";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  items: NavItem[];
  appName: string;
}

/**
 * Desktop sidebar navigation.
 * Brand-accented header with animated active indicator.
 * Hidden on mobile (below md breakpoint).
 */
export function SidebarNav({ items, appName }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-border/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
          <span className="text-sm font-bold text-white tracking-tight">D</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          {appName}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <NavIcon
                name={item.icon}
                className="relative h-5 w-5"
                active={isActive}
              />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
