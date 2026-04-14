import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ContentTransition } from '@/components/motion/content-transition';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { getUserClubMembership } from '@/lib/rides/queries';
import { SeasonDatesSectionLoader } from '@/components/manage/season-dates-section-loader';
import { PaceTiersSectionLoader } from '@/components/manage/pace-tiers-section-loader';
import { MobileGate } from '@/components/manage/mobile-gate';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { manage: content } = appContent;

export default async function ManageSettingsPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  if (userRole !== 'admin') redirect(routes.manageRides);

  return (
    <MobileGate>
      <DashboardShell>
        <PageHeader centered={false} title={content.sections.club} />
        <div className="mt-4 space-y-8">
          <Suspense fallback={<div className="h-32 skeleton-shimmer rounded-(--card-radius)" />}>
            <ContentTransition>
              <SeasonDatesSectionLoader clubId={membership.club_id} />
            </ContentTransition>
          </Suspense>
          <Suspense fallback={<div className="h-32 skeleton-shimmer rounded-(--card-radius)" />}>
            <ContentTransition>
              <PaceTiersSectionLoader clubId={membership.club_id} />
            </ContentTransition>
          </Suspense>
        </div>
      </DashboardShell>
    </MobileGate>
  );
}
