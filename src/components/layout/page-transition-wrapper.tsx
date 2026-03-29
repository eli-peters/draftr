'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationDirection } from '@/hooks/use-navigation-direction';
import { useIsMobile } from '@/hooks/use-is-mobile';

/**
 * Wraps page content and applies a directional slide animation on mobile.
 * Forward navigation slides in from the right; back slides in from the left.
 * No animation on desktop or on initial page load.
 */
export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const direction = useNavigationDirection();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [animClass, setAnimClass] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect -- animation state driven by route change */
  useEffect(() => {
    if (!isMobile || direction === 'none') {
      setAnimClass('');
      return;
    }

    const cls = direction === 'forward' ? 'page-transition-forward' : 'page-transition-back';
    setAnimClass(cls);

    const timer = setTimeout(() => setAnimClass(''), 250);
    return () => clearTimeout(timer);
  }, [pathname, direction, isMobile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return <div className={`min-w-0 ${animClass}`}>{children}</div>;
}
