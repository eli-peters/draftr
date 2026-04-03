'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/config/navigation';
import { NavIcon } from './nav-icon';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  items: NavItem[];
}

/**
 * Mobile bottom tab navigation bar.
 * Hidden on desktop (md+ breakpoint).
 */
export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="fixed left-(--bar-inset-x) right-(--bar-inset-x) bottom-[max(var(--bar-inset-x),env(safe-area-inset-bottom,0px))] z-50 mx-auto max-w-lg md:hidden">
      <nav className="rounded-(--bar-radius) border border-border/20 bg-surface-default/(--bar-bg-opacity) shadow-(--bar-shadow) backdrop-blur-(--bar-backdrop-blur)">
        <div className="flex items-center justify-around px-(--bar-padding-x)">
          {items.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground active:text-foreground',
                )}
              >
                <NavIcon name={item.icon} className="h-6 w-6" active={isActive} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
