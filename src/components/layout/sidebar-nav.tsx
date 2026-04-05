'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { NavItem } from '@/config/navigation';
import { manageSubNav } from '@/config/navigation';
import { routes } from '@/config/routes';
import { NavIcon } from './nav-icon';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  items: NavItem[];
  /** When true, the Manage item expands into sub-navigation. */
  isAdmin?: boolean;
}

/**
 * Desktop sidebar navigation.
 * Hidden on mobile (below md breakpoint).
 * Admins get an expandable Manage group with sub-section links.
 */
export function SidebarNav({ items, isAdmin = false }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isManageActive = pathname === routes.manage || pathname.startsWith(`${routes.manage}/`);

  return (
    <aside className="hidden md:sticky md:top-[calc(4rem+0.75rem)] md:flex md:h-[calc(100vh-4rem-1.5rem)] md:w-60 md:shrink-0 md:flex-col md:rounded-(--card-radius-lg) md:border-(length:--card-border-width) md:border-border md:bg-surface-default md:shadow-(--card-shadow)">
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isManageItem = item.href === routes.manage;

          // Admin manage item: expandable group with sub-navigation
          if (isManageItem && isAdmin) {
            return (
              <div key={item.href}>
                {/* Manage group label — clicking navigates to /manage (rides) and expands */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isManageActive) router.push(routes.manage);
                  }}
                  className={cn(
                    'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                    isManageActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <NavIcon name={item.icon} className="relative h-5 w-5" active={isManageActive} />
                  <span className="relative">{item.label}</span>
                </button>

                {/* Sub-navigation — always visible when any manage route is active */}
                {isManageActive && (
                  <div className="ml-[1.375rem] mt-0.5 flex flex-col gap-0.5 border-l border-(--border-subtle) pl-3">
                    {manageSubNav.map((child) => {
                      const isChildActive =
                        child.href === routes.manage
                          ? pathname === routes.manage
                          : pathname === child.href || pathname.startsWith(`${child.href}/`);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                            isChildActive
                              ? 'text-primary font-medium bg-primary/10'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                          )}
                        >
                          <NavIcon name={child.icon} className="h-4 w-4" active={isChildActive} />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Standard nav item
          const isActive =
            item.href === routes.home
              ? pathname === routes.home
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
