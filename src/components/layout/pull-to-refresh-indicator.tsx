'use client';

import { ArrowDown, SpinnerGap } from '@phosphor-icons/react/dist/ssr';

const INDICATOR_HEIGHT = 120;
const PULL_THRESHOLD = 60;

type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  state: PullState;
}

export function PullToRefreshIndicator({ pullDistance, state }: PullToRefreshIndicatorProps) {
  if (state === 'idle' && pullDistance === 0) return null;

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const rotation = progress * 180;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-center"
      style={{
        height: `${INDICATOR_HEIGHT}px`,
        transform: `translateY(-${INDICATOR_HEIGHT - pullDistance}px)`,
        opacity: progress,
      }}
    >
      {state === 'refreshing' ? (
        <SpinnerGap className="h-5 w-5 animate-spin text-muted-foreground" weight="bold" />
      ) : (
        <ArrowDown
          className="h-5 w-5 text-muted-foreground transition-transform duration-150"
          style={{ transform: `rotate(${rotation}deg)` }}
          weight="bold"
        />
      )}
    </div>
  );
}
