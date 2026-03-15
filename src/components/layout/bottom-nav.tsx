"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { NavItem } from "@/config/navigation";
import { NavIcon } from "./nav-icon";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  items: NavItem[];
}

/**
 * Mobile bottom tab navigation bar.
 * Frosted glass background with animated active indicator.
 * Hidden on desktop (md+ breakpoint).
 */
export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-background/60 backdrop-blur-xl backdrop-saturate-150 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2">
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
                "relative flex flex-1 flex-col items-center gap-1 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="bottomnav-active"
                  className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <NavIcon
                name={item.icon}
                className={cn("h-6 w-6 transition-transform", isActive && "scale-110")}
                active={isActive}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
