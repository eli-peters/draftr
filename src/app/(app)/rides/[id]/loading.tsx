import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonGroup } from '@/components/motion/skeleton-group';

export default function RideDetailLoading() {
  return (
    <DashboardShell>
      <SkeletonGroup>
        {/* Page header skeleton */}
        <div className="flex items-center justify-center">
          <div className="h-7 w-48 skeleton-shimmer" />
        </div>

        {/* Ride detail card skeleton */}
        <div className="mt-6 overflow-clip rounded-xl border border-border bg-card p-0">
          <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
            {/* Location */}
            <div className="space-y-1.5">
              <div className="h-5 w-64 skeleton-shimmer" />
              <div className="h-3.5 w-48 skeleton-shimmer" />
            </div>

            {/* Weather */}
            <div className="h-5 w-40 skeleton-shimmer" />

            <div className="border-t border-border" />

            {/* Metadata rows */}
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="size-4 skeleton-shimmer" />
                  <div className="h-4 skeleton-shimmer" style={{ width: `${80 + i * 20}px` }} />
                </div>
              ))}
            </div>

            {/* Route map placeholder */}
            <div className="aspect-[2.39/1] skeleton-shimmer rounded-xl" />
          </div>
        </div>
      </SkeletonGroup>
    </DashboardShell>
  );
}
