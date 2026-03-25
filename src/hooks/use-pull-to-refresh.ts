'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 60;
const MAX_PULL_DISTANCE = 120;
const RESISTANCE_FACTOR = 0.4;

type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  isEnabled: boolean;
}

interface UsePullToRefreshResult {
  pullDistance: number;
  state: PullState;
}

export function usePullToRefresh({
  onRefresh,
  isEnabled,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [state, setState] = useState<PullState>('idle');
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef(0);
  const startX = useRef(0);
  const startedAtTop = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (state === 'refreshing') return;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      startedAtTop.current = scrollY <= 0;
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      isHorizontal.current = null;
    },
    [state],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!startedAtTop.current || state === 'refreshing') return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startY.current;
      const deltaX = currentX - startX.current;

      // Determine gesture direction on first significant movement
      if (isHorizontal.current === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
        isHorizontal.current = Math.abs(deltaX) > Math.abs(deltaY);
      }

      // Bail on horizontal swipes or upward scrolling
      if (isHorizontal.current || deltaY <= 0) {
        if (state !== 'idle') {
          setState('idle');
          setPullDistance(0);
        }
        return;
      }

      e.preventDefault();

      const distance = Math.min(deltaY * RESISTANCE_FACTOR, MAX_PULL_DISTANCE);

      setPullDistance(distance);
      setState(distance >= PULL_THRESHOLD ? 'ready' : 'pulling');
    },
    [state],
  );

  const handleTouchEnd = useCallback(() => {
    if (!startedAtTop.current || state === 'refreshing') return;

    if (state === 'ready') {
      setState('refreshing');
      setPullDistance(PULL_THRESHOLD * 0.6);

      onRefresh().finally(() => {
        setState('idle');
        setPullDistance(0);
      });
    } else {
      setState('idle');
      setPullDistance(0);
    }
  }, [state, onRefresh]);

  useEffect(() => {
    if (!isEnabled) return;

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pullDistance, state };
}
