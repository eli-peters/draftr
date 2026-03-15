'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/motion/animated-counter';

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
}

interface StatsGridProps {
  stats: StatItem[];
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          className="relative overflow-hidden rounded-xl border border-border/10 bg-card p-5 shadow-sm accent-line-top"
        >
          {stat.icon && (
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <stat.icon weight="duotone" className="h-5 w-5 text-primary" />
            </div>
          )}
          <AnimatedCounter
            value={stat.value}
            suffix={stat.suffix}
            decimals={stat.decimals}
            className="text-stat text-foreground"
          />
          <p className="text-sm font-medium text-muted-foreground mt-2">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
