'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { SPRINGS } from '@/lib/motion';

interface UseEdgeSwipeOptions {
  /** Whether the swipe gesture is enabled. */
  enabled: boolean;
  /** Called when a swipe completes past the threshold. */
  onSwipeComplete: () => void;
  /** Left edge detection zone in px. */
  edgeZone?: number;
  /** Fraction of screen width needed to complete (0–1). */
  threshold?: number;
  /** Velocity in px/s that completes regardless of distance. */
  velocityThreshold?: number;
}

const DEFAULT_EDGE_ZONE = 20;
const DEFAULT_THRESHOLD = 0.35;
const DEFAULT_VELOCITY_THRESHOLD = 500;

/**
 * iOS-style left-edge swipe gesture for back navigation.
 *
 * Returns a Framer Motion `MotionValue` for the horizontal translation
 * and a `isSwiping` flag. Attach `style={{ x }}` to the page wrapper.
 *
 * The gesture:
 * - Only activates when touch starts within `edgeZone` px of the left edge
 * - Locks to horizontal after the first move (aborts if vertical)
 * - Completes when released past `threshold` or with high velocity
 * - Springs back to 0 on cancel
 * - Disabled when a Vaul drawer is open or a horizontal scroll container is under the touch
 */
export function useEdgeSwipe({
  enabled,
  onSwipeComplete,
  edgeZone = DEFAULT_EDGE_ZONE,
  threshold = DEFAULT_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
}: UseEdgeSwipeOptions) {
  const x = useMotionValue(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const shouldReduce = useReducedMotion();

  // Refs for gesture tracking (avoids re-renders during touch)
  const trackingRef = useRef(false);
  const lockedRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const lastXRef = useRef(0);
  const onSwipeCompleteRef = useRef(onSwipeComplete);
  useEffect(() => {
    onSwipeCompleteRef.current = onSwipeComplete;
  }, [onSwipeComplete]);

  const isActive = enabled && !shouldReduce;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isActive) return;

      const touch = e.touches[0];
      if (touch.clientX > edgeZone) return;

      // Skip if a Vaul drawer is open
      if (document.querySelector('[data-vaul-drawer]')) return;

      // Skip if touch target is inside a horizontally scrollable container
      if (hasScrollableAncestor(e.target as Element)) return;

      trackingRef.current = true;
      lockedRef.current = false;
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      startTimeRef.current = Date.now();
      lastXRef.current = touch.clientX;
    },
    [isActive, edgeZone],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!trackingRef.current) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;

      // Direction lock on first significant move
      if (!lockedRef.current) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        // Wait for enough movement to determine direction
        if (absDx < 5 && absDy < 5) return;

        if (absDy > absDx) {
          // Vertical — abort
          trackingRef.current = false;
          return;
        }
        // Locked to horizontal
        lockedRef.current = true;
        setIsSwiping(true);
      }

      // Prevent vertical scroll while swiping
      e.preventDefault();

      // Only allow rightward swipe (positive dx)
      const clampedX = Math.max(0, dx);
      x.set(clampedX);
      lastXRef.current = touch.clientX;
    },
    [x],
  );

  const handleTouchEnd = useCallback(() => {
    if (!trackingRef.current || !lockedRef.current) {
      trackingRef.current = false;
      return;
    }

    trackingRef.current = false;
    const currentX = x.get();
    const screenWidth = window.innerWidth;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const velocity = elapsed > 0 ? currentX / elapsed : 0;

    const pastThreshold = currentX > screenWidth * threshold;
    const fastFlick = velocity > velocityThreshold;

    if (pastThreshold || fastFlick) {
      // Complete — animate off screen then navigate
      animate(x, screenWidth, {
        ...SPRINGS.snappy,
        onComplete: () => {
          setIsSwiping(false);
          x.set(0);
          onSwipeCompleteRef.current();
        },
      });
    } else {
      // Cancel — spring back
      animate(x, 0, {
        ...SPRINGS.snappy,
        onComplete: () => setIsSwiping(false),
      });
    }
  }, [x, threshold, velocityThreshold]);

  // Attach touch listeners (passive: false on touchmove for preventDefault)
  useEffect(() => {
    if (!isActive) return;

    const opts = { passive: true } as const;
    const moveOpts = { passive: false } as const;

    document.addEventListener('touchstart', handleTouchStart, opts);
    document.addEventListener('touchmove', handleTouchMove, moveOpts);
    document.addEventListener('touchend', handleTouchEnd, opts);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isActive, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { x, isSwiping };
}

/** Check if any ancestor of the element has horizontal scroll. */
function hasScrollableAncestor(el: Element | null): boolean {
  let node = el;
  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement && node.scrollWidth > node.clientWidth) {
      const overflow = getComputedStyle(node).overflowX;
      if (overflow === 'auto' || overflow === 'scroll') return true;
    }
    node = node.parentElement;
  }
  return false;
}
