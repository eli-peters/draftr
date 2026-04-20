'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  const isManageActive = pathname === routes.manage || pathname.startsWith(`${routes.manage}/`);
  const isManageExact = pathname === routes.manage;

  return (
    <aside className="hidden md:sticky md:top-[calc(4rem+0.75rem)] md:flex md:h-[calc(100vh-4rem-1.5rem)] md:w-60 md:shrink-0 md:flex-col md:rounded-(--card-radius-lg) md:border-(length:--card-border-width) md:border-border md:bg-surface-default md:shadow-(--card-shadow)">
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isManageItem = item.href === routes.manage;

          // Admin manage item: expandable group with sub-navigation
          if (isManageItem && isAdmin) {
            return (
              <div key={item.href}>
                {/* Manage group label — navigates to /manage dashboard and expands sub-nav */}
                <Link
                  href={routes.manage}
                  className={cn(
                    'relative flex w-full items-center gap-3 rounded-lg py-2.5 pl-4 pr-3 text-sm font-medium transition-colors',
                    isManageExact
                      ? 'font-semibold text-primary before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-primary'
                      : isManageActive
                        ? 'font-semibold text-primary hover:bg-muted/50'
                        : 'text-foreground hover:bg-muted/50',
                  )}
                >
                  <NavIcon name={item.icon} className="relative h-5 w-5" active={isManageActive} />
                  <span className="relative">{item.label}</span>
                </Link>

                {/* Sub-navigation — always visible when any manage route is active */}
                {isManageActive && (
                  <div className="ml-[1.6rem] mt-0.5 flex flex-col gap-0.5 border-l border-(--border-subtle) pl-3">
                    {manageSubNav.map((child) => {
                      const isChildActive =
                        pathname === child.href || pathname.startsWith(`${child.href}/`);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                            isChildActive
                              ? 'font-semibold text-primary before:absolute before:-left-[13px] before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-primary'
                              : 'text-foreground hover:bg-muted/50',
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

          // Standard nav item — leaders go to /manage (leader hub)
          const navHref = item.href;
          const isActive =
            item.href === routes.home
              ? pathname === routes.home
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={navHref}
              className={cn(
                'relative flex items-center gap-3 rounded-lg py-2.5 pl-4 pr-3 text-sm font-medium transition-colors',
                isActive
                  ? 'font-semibold text-primary before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-primary'
                  : 'text-foreground hover:bg-muted/50',
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
