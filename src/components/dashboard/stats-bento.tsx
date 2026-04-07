'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MetricCard, type MetricCardProps } from '@/components/dashboard/metric-card';
import { cn } from '@/lib/utils';
import { DURATIONS, EASE } from '@/lib/motion';

interface StatsBentoProps {
  stats: MetricCardProps[];
  className?: string;
}

export function StatsBento({ stats, className }: StatsBentoProps) {
  const isBento = stats.length === 3;
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: shouldReduce ? 0 : 0.06, delayChildren: 0.05 },
        },
      }}
      className={cn(
        'grid gap-4',
        isBento ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
        className,
      )}
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.title}
          variants={{
            hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: DURATIONS.normal, ease: EASE.out },
            },
          }}
          className={cn(isBento && i === 0 && 'col-span-2 md:col-span-1')}
        >
          <MetricCard {...stat} className={stat.className} />
        </motion.div>
      ))}
    </motion.div>
  );
}
