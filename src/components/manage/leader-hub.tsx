import { Suspense } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { LeaderStatsBentoSection } from './leader-stats-bento-section';
import { LeaderRidesPanelSection } from './leader-rides-panel-section';
import { LeaderCreateRideCta } from './leader-create-ride-cta';
import { appContent } from '@/content/app';

const content = appContent.manage.leaderHub;

interface LeaderHubProps {
  userId: string;
  clubId: string;
}

export function LeaderHub({ userId, clubId }: LeaderHubProps) {
  return (
    <DashboardShell>
      <PageHeader title={content.heading} actions={<LeaderCreateRideCta />} />

      <div className="mt-2 min-w-0 space-y-card-stack">
        {/* Stats bento — same component as admin dashboard, leader-scoped data */}
        <Suspense
          fallback={
            <div className="grid grid-cols-3 gap-card-stack">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 skeleton-shimmer rounded-(--card-radius)" />
              ))}
            </div>
          }
        >
          <LeaderStatsBentoSection userId={userId} clubId={clubId} />
        </Suspense>

        {/* Rides table — same ManageRidesPanel as admin, scoped to this leader */}
        <Suspense
          fallback={
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 skeleton-shimmer rounded-(--card-radius)" />
              ))}
            </div>
          }
        >
          <LeaderRidesPanelSection userId={userId} clubId={clubId} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
