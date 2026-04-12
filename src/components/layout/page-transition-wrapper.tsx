'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationDirection } from '@/hooks/use-navigation-direction';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useEdgeSwipe } from '@/hooks/use-edge-swipe';
import { useNavigationOrigin } from '@/components/navigation-origin-provider';
import { useHaptic } from '@/hooks/use-haptic';

/**
 * Wraps page content and applies a directional slide animation on mobile.
 * Forward navigation slides in from the right; back slides in from the left.
 * No animation on desktop or on initial page load.
 *
 * Also handles iOS-style edge swipe gesture for back navigation when the
 * user arrived from the current page's structural parent.
 */
export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const direction = useNavigationDirection();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const { canSwipeBack } = useNavigationOrigin();
  const haptic = useHaptic();
  const [animClass, setAnimClass] = useState('');

  const { x, isSwiping } = useEdgeSwipe({
    enabled: isMobile && canSwipeBack,
    onSwipeComplete: () => {
      haptic.medium();
      router.back();
    },
  });

  /* eslint-disable react-hooks/set-state-in-effect -- animation state driven by route change */
  useEffect(() => {
    if (!isMobile || direction === 'none') {
      setAnimClass('');
      return;
    }

    const cls = direction === 'forward' ? 'page-transition-forward' : 'page-transition-back';
    setAnimClass(cls);

    const timer = setTimeout(() => setAnimClass(''), 350);
    return () => clearTimeout(timer);
  }, [pathname, direction, isMobile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Suppress CSS animation during active swipe (gesture drives the transform)
  const effectiveAnimClass = isSwiping ? '' : animClass;

  return (
    <motion.div
      className={`min-w-0 ${effectiveAnimClass} ${isSwiping ? 'swipe-active' : ''}`}
      style={{ x }}
    >
      {children}
    </motion.div>
  );
}
