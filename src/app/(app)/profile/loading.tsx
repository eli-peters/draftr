import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function ProfileLoading() {
  return (
    <DashboardShell>
      {/* Avatar + name skeleton */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <div className="size-24 skeleton-shimmer rounded-full" />
        <div className="h-7 w-44 skeleton-shimmer rounded" />
        <div className="h-4 w-28 skeleton-shimmer rounded" />
      </div>

      {/* Stats skeleton */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-22.5 skeleton-shimmer rounded-(--card-radius)" />
        ))}
      </div>

      {/* Bio / details skeleton */}
      <div className="mt-6 space-y-4">
        <div className="h-20 skeleton-shimmer rounded-(--card-radius)" />
        <div className="h-32 skeleton-shimmer rounded-(--card-radius)" />
      </div>
    </DashboardShell>
  );
}
