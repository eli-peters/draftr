import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonGroup } from '@/components/motion/skeleton-group';

export default function RidesLoading() {
  return (
    <DashboardShell>
      <SkeletonGroup>
        {/* Page header skeleton */}
        <div className="flex items-center justify-center">
          <div className="h-7 w-40 skeleton-shimmer rounded" />
        </div>

        {/* Filter chips skeleton */}
        <div className="mt-6 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 w-20 skeleton-shimmer rounded-full" />
          ))}
        </div>

        {/* Ride cards skeleton */}
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 skeleton-shimmer rounded-(--card-radius)" />
          ))}
        </div>
      </SkeletonGroup>
    </DashboardShell>
  );
}
