'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { useNavigationDirection } from '@/hooks/use-navigation-direction';
import { useIsMobile } from '@/hooks/use-is-mobile';

/**
 * Forward navigation slides in from the right; back slides in from the left.
 * No animation on desktop or on initial load.
 *
 * On Capacitor iOS the back-direction animation is suppressed: WKWebView's
 * native edge-swipe gesture ships its own page-peel and we let it own that
 * direction entirely.
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

    if (Capacitor.isNativePlatform() && direction === 'back') {
      setAnimClass('');
      return;
    }

    const cls = direction === 'forward' ? 'page-transition-forward' : 'page-transition-back';
    setAnimClass(cls);

    const timer = setTimeout(() => setAnimClass(''), 350);
    return () => clearTimeout(timer);
  }, [pathname, direction, isMobile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return <div className={`min-w-0 ${animClass}`}>{children}</div>;
}
