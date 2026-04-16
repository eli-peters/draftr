import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonGroup } from '@/components/motion/skeleton-group';

export default function RideHistoryLoading() {
  return (
    <DashboardShell>
      <SkeletonGroup>
        <div className="flex items-center justify-center">
          <div className="h-7 w-40 skeleton-shimmer rounded" />
        </div>

        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 skeleton-shimmer rounded-(--card-radius)" />
          ))}
        </div>
      </SkeletonGroup>
    </DashboardShell>
  );
}
