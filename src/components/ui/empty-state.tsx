'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { DURATIONS, EASE, SPRINGS } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'destructive';
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  variant = 'primary',
  children,
  className,
}: EmptyStateProps) {
  const isDestructive = variant === 'destructive';
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
      animate={shouldReduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: DURATIONS.normal, ease: EASE.out }}
      className={cn('flex flex-col items-center justify-center text-center py-8', className)}
    >
      {icon && (
        <motion.div
          initial={shouldReduce ? undefined : { scale: 0.8, opacity: 0 }}
          animate={shouldReduce ? undefined : { scale: 1, opacity: 1 }}
          transition={shouldReduce ? undefined : { ...SPRINGS.gentle, delay: 0.1 }}
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full [&>svg]:h-10 [&>svg]:w-10',
            isDestructive
              ? 'bg-destructive/10 [&>svg]:text-destructive'
              : 'bg-primary/8 [&>svg]:text-primary/60',
          )}
        >
          {icon}
        </motion.div>
      )}
      <p className={cn('text-lg font-semibold text-foreground', icon && 'mt-4')}>{title}</p>
      <p className="mt-2 text-base text-muted-foreground max-w-80">{description}</p>
      {children}
    </motion.div>
  );
}
