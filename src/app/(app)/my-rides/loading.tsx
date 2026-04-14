import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonGroup } from '@/components/motion/skeleton-group';

export default function MyRidesLoading() {
  return (
    <DashboardShell>
      <SkeletonGroup>
        {/* Page header skeleton */}
        <div className="flex items-center justify-center">
          <div className="h-7 w-36 skeleton-shimmer rounded" />
        </div>

        {/* Tab bar skeleton */}
        <div className="mt-6 flex gap-4 border-b border-border pb-2">
          <div className="h-5 w-24 skeleton-shimmer rounded" />
          <div className="h-5 w-16 skeleton-shimmer rounded" />
        </div>

        {/* Ride cards skeleton */}
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 skeleton-shimmer rounded-(--card-radius)" />
          ))}
        </div>
      </SkeletonGroup>
    </DashboardShell>
  );
}
