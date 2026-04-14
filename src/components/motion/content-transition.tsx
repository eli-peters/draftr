'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { DURATIONS, EASE } from '@/lib/motion';
import { useReducedMotion } from 'framer-motion';

interface ContentTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fade-and-rise entrance for content that replaces a skeleton.
 *
 * Wrap the resolved content inside a Suspense boundary with this
 * component so the skeleton → real content swap feels smooth
 * instead of a hard pop.
 *
 * Reduced motion: collapses to instant appearance (no animation).
 */
export function ContentTransition({ children, className }: ContentTransitionProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduce ? { duration: 0 } : { duration: DURATIONS.fast, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}
