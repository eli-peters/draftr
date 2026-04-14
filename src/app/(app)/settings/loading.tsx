import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { SkeletonGroup } from '@/components/motion/skeleton-group';

export default function SettingsLoading() {
  return (
    <DashboardShell>
      <SkeletonGroup>
        {/* Page header skeleton */}
        <div className="flex items-center justify-center">
          <div className="h-7 w-28 skeleton-shimmer rounded" />
        </div>

        {/* Settings cards skeleton */}
        <div className="mt-6 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 skeleton-shimmer rounded-(--card-radius)" />
          ))}
        </div>
      </SkeletonGroup>
    </DashboardShell>
  );
}
