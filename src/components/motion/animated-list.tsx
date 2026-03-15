"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  /** Delay between each item in seconds */
  stagger?: number;
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

/**
 * Wraps children in staggered fade-in-up animations.
 * Each direct child gets its own animated container.
 */
export function AnimatedList({
  children,
  className,
  stagger = 0.06,
}: AnimatedListProps) {
  return (
    <motion.div
      variants={{
        ...container,
        show: { transition: { staggerChildren: stagger } },
      }}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Single animated item for standalone use.
 */
export function AnimatedItem({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
