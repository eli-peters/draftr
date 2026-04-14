import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ContentTransition } from '@/components/motion/content-transition';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { AdminStatsBentoSection } from '@/components/manage/admin-stats-bento-section';
import { SectionCardsSection } from '@/components/manage/section-cards-section';
import { LeaderHub } from '@/components/manage/leader-hub';

import { getUserClubMembership } from '@/lib/rides/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';
const { dashboard: content } = appContent.manage;

export default async function ManagePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const role = membership.role;
  const userRole: UserRole = role === 'admin' || role === 'ride_leader' ? role : 'rider';

  // Leaders get the leader hub
  if (userRole === 'ride_leader') {
    return <LeaderHub userId={membership.user_id} clubId={membership.club_id} />;
  }

  // Non-leaders and non-admins can't access manage
  if (userRole !== 'admin') redirect(routes.signIn);

  // Admin dashboard
  return (
    <DashboardShell>
      <PageHeader centered={false} title={content.heading} />
      <div className="mt-2 min-w-0 space-y-card-stack">
        <Suspense
          fallback={
            <div className="grid grid-cols-3 gap-card-stack">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 skeleton-shimmer rounded-(--card-radius)" />
              ))}
            </div>
          }
        >
          <ContentTransition>
            <AdminStatsBentoSection clubId={membership.club_id} />
          </ContentTransition>
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
          <ContentTransition>
            <SectionCardsSection clubId={membership.club_id} />
          </ContentTransition>
        </Suspense>
      </div>
    </DashboardShell>
  );
}
