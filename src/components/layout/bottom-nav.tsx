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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-default/80 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around px-2">
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
                isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
              )}
            >
              {isActive && (
                <span className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
              <NavIcon name={item.icon} className="h-6 w-6" active={isActive} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
