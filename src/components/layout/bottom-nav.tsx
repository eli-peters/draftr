'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import type { NavItem } from '@/config/navigation';
import { NavIcon } from './nav-icon';
import { cn } from '@/lib/utils';
import { SPRINGS } from '@/lib/motion';

const MotionLink = motion.create(Link);

interface BottomNavProps {
  items: NavItem[];
}

/**
 * Mobile bottom tab navigation bar.
 * Hidden on desktop (md+ breakpoint).
 */
export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();

  // TODO: Scroll-to-minimize — collapse bar to icon-only pill on scroll down,
  // expand on scroll up. Deferred to a future pass.

  return (
    <div className="fixed left-(--bar-inset-x) right-(--bar-inset-x) bottom-(--bar-inset-bottom) z-50 mx-auto max-w-lg md:hidden">
      <nav className="rounded-(--bar-radius) border border-border/(--bar-border-opacity) bg-surface-default/(--bar-bg-opacity) shadow-(--bar-shadow) backdrop-blur-(--bar-backdrop-blur) backdrop-saturate-(--bar-backdrop-saturate)">
        <LayoutGroup id="bottom-nav">
          <div className="flex items-center justify-around px-(--bar-padding-x)">
            {items.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <MotionLink
                  key={item.href}
                  href={item.href}
                  whileTap={shouldReduce ? undefined : { scale: 0.91 }}
                  transition={SPRINGS.gentle}
                  className={cn(
                    'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'font-semibold text-primary'
                      : 'text-foreground before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-0.5 before:rounded-full before:bg-primary/0 before:transition-colors hover:before:bg-primary/10 active:text-foreground',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-pill"
                      className="absolute inset-x-0 inset-y-0.5 -z-10 rounded-full bg-primary/10"
                      transition={shouldReduce ? { duration: 0 } : SPRINGS.snappy}
                    />
                  )}
                  <motion.div
                    animate={isActive && !shouldReduce ? { y: [0, -2, 0] } : { y: 0 }}
                    transition={
                      shouldReduce
                        ? { duration: 0 }
                        : { duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }
                    }
                  >
                    <NavIcon name={item.icon} className="h-6 w-6" active={isActive} />
                  </motion.div>
                  <span>{item.label}</span>
                </MotionLink>
              );
            })}
          </div>
        </LayoutGroup>
      </nav>
    </div>
  );
}
