'use client';

import type { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';

interface RideDetailResponsiveProps {
  mobile: ReactNode;
  desktop: ReactNode;
}

/**
 * Mount-time switch between mobile and desktop ride-detail layouts. Only one
 * tree is mounted at any moment, which is necessary because the roster
 * animates via Framer Motion `layoutId`s that must remain unique — rendering
 * both trees (CSS-hidden) creates layoutId collisions and hides the rows.
 */
export function RideDetailResponsive({ mobile, desktop }: RideDetailResponsiveProps) {
  const isMobile = useIsMobile();
  return <>{isMobile ? mobile : desktop}</>;
}
