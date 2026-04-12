'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getParentRoute, isChildRoute } from '@/config/routes';

interface NavigationOriginState {
  /** Whether the user arrived at this child page from its structural parent. */
  arrivedFromParent: boolean;
  /** Whether swipe-back should be enabled (child route + arrived from parent). */
  canSwipeBack: boolean;
  /** Whether there is any referrer in the navigation stack (for back button behavior). */
  hasReferrer: boolean;
}

const DEFAULT_STATE: NavigationOriginState = {
  arrivedFromParent: false,
  canSwipeBack: false,
  hasReferrer: false,
};

const NavigationOriginContext = createContext<NavigationOriginState>(DEFAULT_STATE);

const MAX_STACK_DEPTH = 20;

/**
 * Tracks a referrer stack across client-side navigations to determine
 * whether the user arrived at the current page from its structural parent.
 *
 * Forward navigation pushes the previous path onto the stack.
 * Back navigation (popstate) pops from the stack.
 * `canSwipeBack` is true when the top of the stack is the current page's
 * structural parent — meaning the user drilled down, not jumped laterally.
 */
export function NavigationOriginProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<NavigationOriginState>(DEFAULT_STATE);

  const stackRef = useRef<string[]>([]);
  const prevPathnameRef = useRef(pathname);
  const isPopStateRef = useRef(false);

  // Listen for popstate to distinguish forward push from back pop
  useEffect(() => {
    function handlePopState() {
      isPopStateRef.current = true;
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // On pathname change, update the referrer stack and derive state
  /* eslint-disable react-hooks/set-state-in-effect -- derive navigation origin from pathname changes */
  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;

    const stack = stackRef.current;

    if (isPopStateRef.current) {
      // Back navigation — pop the referrer
      stack.pop();
      isPopStateRef.current = false;
    } else {
      // Forward navigation — push the page we're leaving
      stack.push(prevPathnameRef.current);
      if (stack.length > MAX_STACK_DEPTH) stack.shift();
    }

    prevPathnameRef.current = pathname;

    // Compute whether the referrer (top of stack) is the structural parent
    const referrer = stack.length > 0 ? stack[stack.length - 1] : null;
    const parentRoute = getParentRoute(pathname);
    const fromParent = referrer !== null && referrer === parentRoute;

    setState({
      arrivedFromParent: fromParent,
      canSwipeBack: isChildRoute(pathname) && fromParent,
      hasReferrer: referrer !== null,
    });
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <NavigationOriginContext.Provider value={state}>{children}</NavigationOriginContext.Provider>
  );
}

export function useNavigationOrigin() {
  return useContext(NavigationOriginContext);
}
