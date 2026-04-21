'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MapBackdropSheetProps {
  backdrop: ReactNode;
  children: ReactNode;
  /** Height of the map peek visible above the sheet at rest. Default 38dvh. */
  peekHeight?: string;
  /** Height of the fixed backdrop layer (should exceed peekHeight). Default 65dvh. */
  backdropHeight?: string;
  /** Parallax speed of the map relative to scroll. 0 = stationary, 1 = tracks scroll 1:1. Default 0.4. */
  parallaxFactor?: number;
  /** Maximum blur applied to the map as the sheet scrolls up. Default 16px. */
  maxBlurPx?: number;
  /** Maximum opacity of the scrim that fades in over the map. Default 0.55. */
  maxScrimOpacity?: number;
  className?: string;
}

/**
 * Airbnb-style full-bleed map backdrop with a rounded-top content sheet
 * overlaying the lower portion of the viewport. Native browser scroll drives
 * the sheet's position; Framer Motion layers on a subtle parallax, progressive
 * blur, and scrim fade so the map feels like it's sinking behind the content.
 */
export function MapBackdropSheet({
  backdrop,
  children,
  peekHeight = '38dvh',
  backdropHeight = '65dvh',
  parallaxFactor = 0.4,
  maxBlurPx = 16,
  maxScrimOpacity = 0.55,
  className,
}: MapBackdropSheetProps) {
  const peekPx = usePeekPixels(peekHeight);
  const { scrollY } = useScroll();

  // Parallax completes over the full peek distance.
  const mapY = useTransform(scrollY, [0, peekPx || 1], [0, -(peekPx || 0) * parallaxFactor]);

  // Blur + scrim follow a soft ease-in curve: barely perceptible through the
  // first half of the scroll, ramping hard as the sheet approaches the top.
  // Multi-keyframe stops give a more controllable curve than a global ease
  // and let the scrim and blur share the same shape.
  const base = peekPx || 1;
  const stops = [0, base * 0.4, base * 0.7, base];
  const blur = useTransform(scrollY, stops, [
    `blur(0px)`,
    `blur(${(maxBlurPx * 0.08).toFixed(2)}px)`,
    `blur(${(maxBlurPx * 0.35).toFixed(2)}px)`,
    `blur(${maxBlurPx}px)`,
  ]);
  const scrimOpacity = useTransform(scrollY, stops, [
    0,
    maxScrimOpacity * 0.08,
    maxScrimOpacity * 0.3,
    maxScrimOpacity,
  ]);

  const style = {
    '--map-peek': peekHeight,
    '--map-backdrop-height': backdropHeight,
  } as CSSProperties;

  return (
    <div className={cn('relative min-h-dvh', className)} style={style}>
      <motion.div
        style={{ y: mapY, filter: blur }}
        className="fixed inset-x-0 top-0 z-0 h-(--map-backdrop-height) will-change-transform"
      >
        {backdrop}
      </motion.div>
      <motion.div
        style={{ opacity: scrimOpacity }}
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-(--map-backdrop-height) bg-background"
        aria-hidden
      />
      <section className="relative z-10 mt-(--map-peek) min-h-dvh rounded-t-3xl bg-background shadow-[0_-16px_40px_-8px_rgba(0,0,0,0.18)]">
        {children}
      </section>
    </div>
  );
}

/**
 * Resolve the peek height (CSS string like "38dvh") into a pixel value that
 * Framer Motion can interpolate against. Re-measured on viewport resize.
 */
function usePeekPixels(peekHeight: string): number {
  const [peekPx, setPeekPx] = useState(0);

  useEffect(() => {
    const measure = () => {
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.height = peekHeight;
      document.body.appendChild(probe);
      setPeekPx(probe.getBoundingClientRect().height);
      document.body.removeChild(probe);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [peekHeight]);

  return peekPx;
}
