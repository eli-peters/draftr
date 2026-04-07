'use client';

import { useEffect, useState } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { DURATIONS, EASE } from '@/lib/motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

/**
 * Tweens a numeric value from its previous render to the new one.
 * Respects prefers-reduced-motion (snaps instantly).
 */
export function AnimatedCounter({
  value,
  duration = DURATIONS.slow,
  suffix = '',
  prefix = '',
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const shouldReduce = useReducedMotion();
  const motionValue = useMotionValue(value);
  const [display, setDisplay] = useState(() => formatNumber(value, decimals));

  useEffect(() => {
    if (shouldReduce) {
      motionValue.set(value);
      // Schedule the format update outside the effect body to avoid
      // cascading-render warnings in strict-mode builds.
      const id = requestAnimationFrame(() => setDisplay(formatNumber(value, decimals)));
      return () => cancelAnimationFrame(id);
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: EASE.out,
      onUpdate: (latest) => setDisplay(formatNumber(latest, decimals)),
    });

    return () => controls.stop();
  }, [value, duration, decimals, motionValue, shouldReduce]);

  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

function formatNumber(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
}
