import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContentToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function ContentToolbar({ left, right, className }: ContentToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-baseline gap-2">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
