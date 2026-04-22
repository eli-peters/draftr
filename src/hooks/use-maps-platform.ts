'use client';

import { useSyncExternalStore } from 'react';
import { detectMapsPlatform, type MapsPlatform } from '@/lib/maps/platform';

function subscribe() {
  return () => {};
}

function getSnapshot(): MapsPlatform {
  return detectMapsPlatform(navigator.userAgent, navigator.maxTouchPoints);
}

function getServerSnapshot(): MapsPlatform {
  return 'web';
}

/**
 * Returns the user's maps platform (ios / android / web). SSR-safe — defaults
 * to `'web'` on the server and resolves on the client after hydration.
 */
export function useMapsPlatform(): MapsPlatform {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
