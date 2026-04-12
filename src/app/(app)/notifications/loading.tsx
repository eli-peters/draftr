import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function NotificationsLoading() {
  return (
    <DashboardShell>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 skeleton-shimmer rounded" />
        <div className="h-8 w-24 skeleton-shimmer rounded" />
      </div>

      {/* Notification items skeleton */}
      <div className="mt-6 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 skeleton-shimmer rounded-(--card-radius)" />
        ))}
      </div>
    </DashboardShell>
  );
}
