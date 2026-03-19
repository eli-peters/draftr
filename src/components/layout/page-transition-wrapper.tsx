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

  return <div className={animClass}>{children}</div>;
}
