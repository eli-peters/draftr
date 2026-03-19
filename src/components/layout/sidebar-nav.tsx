'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/config/navigation';
import { NavIcon } from './nav-icon';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  items: NavItem[];
  appName: string;
}

/**
 * Desktop sidebar navigation.
 * Hidden on mobile (below md breakpoint).
 */
export function SidebarNav({ items, appName }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-r md:border-border md:bg-background">
      {/* Brand header */}
      <div className="flex h-14 items-center gap-3 px-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground tracking-tight">D</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">{appName}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
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
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <NavIcon name={item.icon} className="relative h-5 w-5" active={isActive} />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
