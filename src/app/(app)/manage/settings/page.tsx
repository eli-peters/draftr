import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { CalendarBlank, Gauge } from '@phosphor-icons/react/dist/ssr';
import { ContentTransition } from '@/components/motion/content-transition';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ContentCard } from '@/components/ui/content-card';
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
        <PageHeader title={content.sections.club} />
        <div className="mt-4 space-y-4">
          <ContentCard
            variant="admin"
            icon={CalendarBlank}
            heading={content.season.heading}
            subtitle={content.season.description}
          >
            <Suspense fallback={<div className="h-10 skeleton-shimmer rounded-md" />}>
              <ContentTransition>
                <SeasonDatesSectionLoader clubId={membership.club_id} />
              </ContentTransition>
            </Suspense>
          </ContentCard>
          <ContentCard
            variant="admin"
            icon={Gauge}
            heading={content.paceTiers.heading}
            subtitle={content.paceTiers.description}
          >
            <Suspense fallback={<div className="h-48 skeleton-shimmer rounded-md" />}>
              <ContentTransition>
                <PaceTiersSectionLoader clubId={membership.club_id} />
              </ContentTransition>
            </Suspense>
          </ContentCard>
        </div>
      </DashboardShell>
    </MobileGate>
  );
}
