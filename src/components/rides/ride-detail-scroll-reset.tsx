'use client';

import { useLayoutEffect } from 'react';

interface RideDetailScrollResetProps {
  rideId: string;
}

/**
 * Forces the window to scroll position (0, 0) every time the ride detail page
 * mounts or the ride id changes. The map backdrop + sheet layout relies on
 * scrollY starting at 0 for parallax + peek calculations; SPA back-navigation
 * and browser scroll restoration can land the page mid-scroll otherwise.
 */
export function RideDetailScrollReset({ rideId }: RideDetailScrollResetProps) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [rideId]);

  return null;
}
