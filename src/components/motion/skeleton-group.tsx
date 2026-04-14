'use client';

import { Children, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, useMotionPresets } from '@/lib/motion';

interface SkeletonGroupProps {
  children: ReactNode;
  /** Inter-element stagger delay in seconds. Default 0.06. */
  stagger?: number;
  className?: string;
}

/**
 * Wraps skeleton blocks in a staggered entrance animation.
 *
 * Each direct child fades and rises into view sequentially,
 * creating a cascading "materialising" effect instead of all
 * blocks appearing simultaneously.
 *
 * Server-rendered HTML remains the SSR fallback — the stagger
 * is a progressive enhancement after hydration.
 */
export function SkeletonGroup({ children, stagger = 0.06, className }: SkeletonGroupProps) {
  const { skeletonItem: resolvedVariants } = useMotionPresets();
  const containerVariants = staggerContainer(stagger);

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Children.map(children, (child) =>
        child ? <motion.div variants={resolvedVariants}>{child}</motion.div> : null,
      )}
    </motion.div>
  );
}
