import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonGroup } from '@/components/motion/skeleton-group';
import { CommentsSkeleton } from './_components/comments-skeleton';

export default function RideDetailLoading() {
  return (
    <DashboardShell>
      <SkeletonGroup>
        {/* PageHeader — centered title */}
        <div className="flex justify-center">
          <div className="h-9 w-56 skeleton-shimmer rounded" />
        </div>

        {/* RideDetailCard */}
        <div className="mt-6 overflow-clip rounded-(--card-radius) border border-border bg-card p-0">
          <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
            {/* Start location: name + address */}
            <div className="space-y-1.5">
              <div className="h-5 w-52 skeleton-shimmer rounded" />
              <div className="h-4 w-40 skeleton-shimmer rounded" />
            </div>

            {/* Weather */}
            <div className="h-4 w-44 skeleton-shimmer rounded" />

            <div className="border-t border-border" />

            {/* Metadata rows: date, time, distance, elevation, pace */}
            <div className="space-y-1">
              {[160, 96, 120, 112, 144].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="size-4 shrink-0 skeleton-shimmer rounded" />
                  <div className="h-4 skeleton-shimmer rounded" style={{ width: w }} />
                </div>
              ))}
            </div>

            {/* Route map */}
            <div className="aspect-[2.39/1] skeleton-shimmer rounded-xl" />
          </div>
        </div>

        {/* Riders ContentCard */}
        <div className="mt-card-stack rounded-(--card-radius) border border-border bg-card p-(--card-padding) md:p-(--card-padding-md)">
          <div className="mb-3 flex flex-col items-center gap-2 text-center">
            <div className="size-8 skeleton-shimmer rounded" />
            <div className="h-5 w-28 skeleton-shimmer rounded" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-8 shrink-0 skeleton-shimmer rounded-full" />
                <div className="h-4 w-32 skeleton-shimmer rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="mt-card-stack">
          <CommentsSkeleton />
        </div>
      </SkeletonGroup>
    </DashboardShell>
  );
}
