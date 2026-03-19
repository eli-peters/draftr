'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type Direction = 'forward' | 'back' | 'none';

/**
 * Detects whether the current navigation was a forward push or a back pop.
 * Uses the `popstate` event (fired on browser/router back) to distinguish.
 */
export function useNavigationDirection(): Direction {
  const pathname = usePathname();
  const [direction, setDirection] = useState<Direction>('none');
  const isPopState = useRef(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    function handlePopState() {
      isPopState.current = true;
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (pathname === prevPathname.current) return;

    if (isPopState.current) {
      setDirection('back');
      isPopState.current = false;
    } else {
      setDirection('forward');
    }
    prevPathname.current = pathname;
  }, [pathname]);

  return direction;
}
