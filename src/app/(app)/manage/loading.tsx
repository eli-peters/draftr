import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonGroup } from '@/components/motion/skeleton-group';

export default function ManageLoading() {
  return (
    <DashboardShell>
      <SkeletonGroup>
        {/* Page header skeleton */}
        <div className="flex items-start">
          <div className="h-7 w-32 skeleton-shimmer rounded" />
        </div>

        {/* Stats bento skeleton */}
        <div className="mt-6 grid grid-cols-3 gap-card-stack">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 skeleton-shimmer rounded-(--card-radius)" />
          ))}
        </div>

        {/* Section cards skeleton */}
        <div className="mt-card-stack space-y-card-stack">
          <div className="h-40 skeleton-shimmer rounded-(--card-radius)" />
          <div className="grid grid-cols-2 gap-card-stack">
            <div className="h-40 skeleton-shimmer rounded-(--card-radius)" />
            <div className="h-40 skeleton-shimmer rounded-(--card-radius)" />
          </div>
        </div>
      </SkeletonGroup>
    </DashboardShell>
  );
}
