'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isChildRoute } from '@/config/routes';

interface NavigationOriginState {
  /** Whether swipe-back should be enabled. True on any child route reached via in-app navigation. */
  canSwipeBack: boolean;
  /** Whether there is any referrer in the navigation stack (for back button behavior). */
  hasReferrer: boolean;
}

const DEFAULT_STATE: NavigationOriginState = {
  canSwipeBack: false,
  hasReferrer: false,
};

const NavigationOriginContext = createContext<NavigationOriginState>(DEFAULT_STATE);

const MAX_STACK_DEPTH = 20;

/**
 * Tracks a referrer stack across client-side navigations.
 *
 * Forward navigation pushes the previous path onto the stack; back (popstate)
 * pops from it. `canSwipeBack` is true on any child route (L2+) when the user
 * has at least one referrer — i.e., they drilled in from somewhere else in
 * the app rather than landing here on a fresh load. This covers Home→detail,
 * Rides→detail, and deeper L3→L2 hops without enumerating each pair.
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

    const hasReferrer = stack.length > 0;
    setState({
      canSwipeBack: isChildRoute(pathname) && hasReferrer,
      hasReferrer,
    });
  }, [pathname]);

  // Capacitor iOS: gate WKWebView.allowsBackForwardNavigationGestures on the
  // same rule. No-op in browsers — window.webkit is only injected by WKWebView.
  useEffect(() => {
    const handler = (
      window as unknown as {
        webkit?: { messageHandlers?: { swipeGate?: { postMessage: (msg: unknown) => void } } };
      }
    ).webkit?.messageHandlers?.swipeGate;
    handler?.postMessage({ enabled: state.canSwipeBack });
  }, [state.canSwipeBack]);

  return (
    <NavigationOriginContext.Provider value={state}>{children}</NavigationOriginContext.Provider>
  );
}

export function useNavigationOrigin() {
  return useContext(NavigationOriginContext);
}
