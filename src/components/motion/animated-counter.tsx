"use client";

import { useEffect, useRef } from "react";
import {
  useMotionValue,
  useTransform,
  animate,
  motion,
  useInView,
} from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString()
  );
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      animate(motionValue, value, {
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      });
    }
  }, [isInView, value, duration, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${v}${suffix}`;
      }
    });
    return unsubscribe;
  }, [rounded, prefix, suffix]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    />
  );
}
