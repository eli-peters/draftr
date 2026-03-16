import type { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      {children}
    </div>
  );
}
