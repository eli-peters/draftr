'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DURATIONS, EASE } from '@/lib/motion';

interface InlineEditTransitionProps {
  /** Stable identifier for AnimatePresence — typically 'edit' vs 'view'. */
  editing: boolean;
  edit: ReactNode;
  view: ReactNode;
}

/**
 * Crossfade + height transition between an inline edit form and its
 * read-only counterpart. The expanding pane slides its height while
 * fading in; the collapsing pane fades out beneath it.
 *
 * Used by all profile and manage section inline editors so the pattern
 * is consistent across the app.
 */
export function InlineEditTransition({ editing, edit, view }: InlineEditTransitionProps) {
  const shouldReduce = useReducedMotion();

  const transition = shouldReduce
    ? { duration: DURATIONS.fast }
    : { duration: DURATIONS.normal, ease: EASE.out };

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={editing ? 'edit' : 'view'}
        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
        animate={shouldReduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
        exit={shouldReduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
        transition={transition}
        style={{ overflow: 'hidden' }}
      >
        {editing ? edit : view}
      </motion.div>
    </AnimatePresence>
  );
}
