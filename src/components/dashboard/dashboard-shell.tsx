import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  // Spacing scale: mt-3 (within section), mt-4 (compact), mt-6 (moderate),
  // mt-8 (major section), mt-12 (distinct zone). See DESIGN_SYSTEM.md.
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col px-5 pt-8 pb-(--nav-clearance) md:px-6 md:pt-10 md:pb-16',
        className,
      )}
    >
      {children}
    </div>
  );
}
