import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { AdminStatsBentoSection } from '@/components/manage/admin-stats-bento-section';
import { SectionCardsSection } from '@/components/manage/section-cards-section';

import { getUserClubMembership } from '@/lib/rides/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { dashboard: content } = appContent.manage;

export default async function AdminDashboardPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  if (userRole === 'ride_leader') redirect(routes.manageRides);
  if (userRole !== 'admin') redirect(routes.signIn);

  return (
    <DashboardShell>
      <PageHeader centered={false} title={content.heading} />
      <div className="mt-2 min-w-0 space-y-card-stack">
        {/* Stats bento and section cards stream independently */}
        <Suspense
          fallback={
            <div className="grid grid-cols-3 gap-card-stack">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 skeleton-shimmer rounded-(--card-radius)" />
              ))}
            </div>
          }
        >
          <AdminStatsBentoSection clubId={membership.club_id} />
        </Suspense>

        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-card-stack md:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-32 skeleton-shimmer rounded-(--card-radius)" />
              ))}
            </div>
          }
        >
          <SectionCardsSection clubId={membership.club_id} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
