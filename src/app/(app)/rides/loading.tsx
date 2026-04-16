import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonGroup } from '@/components/motion/skeleton-group';

export default function RidesLoading() {
  return (
    <DashboardShell>
      <SkeletonGroup>
        {/* Calendar header skeleton */}
        <div className="flex items-center justify-between px-1">
          <div className="h-6 w-36 skeleton-shimmer rounded" />
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 w-8 skeleton-shimmer rounded-full" />
            ))}
          </div>
        </div>

        {/* Calendar grid skeleton */}
        <div className="mt-4 grid grid-cols-7 gap-y-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-1.5">
              <div className="h-7 w-7 skeleton-shimmer rounded-full" />
              <div className="h-1.5 w-6 skeleton-shimmer rounded" />
            </div>
          ))}
        </div>

        {/* Filter chips skeleton */}
        <div className="mt-4 flex justify-center gap-2">
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
