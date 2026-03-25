import type { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  // Spacing scale: mt-3 (within section), mt-4 (compact), mt-6 (moderate),
  // mt-8 (major section), mt-12 (distinct zone). See DESIGN_SYSTEM.md.
  return (
    <div className="flex flex-1 flex-col px-4 pt-8 pb-12 md:px-6 md:pt-10 md:pb-16">{children}</div>
  );
}
