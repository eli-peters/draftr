'use client';

import { useEffect, useRef, useState } from 'react';
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
 * Renders a numeric value. On *change*, tweens from the previous value to the
 * new one. On initial mount the number snaps in immediately — premium internal
 * dashboards (Linear, Stripe, Notion) display KPI numbers instantly; only
 * subsequent live updates earn the tween. Respects prefers-reduced-motion.
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
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // First render: snap to the value, no tween. Subsequent value changes
    // animate from the previous frame's value.
    if (isFirstRenderRef.current || shouldReduce) {
      isFirstRenderRef.current = false;
      motionValue.set(value);
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
