import { redirect } from 'next/navigation';
import { Bicycle, UserCircleMinus, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatsBento } from '@/components/dashboard/stats-bento';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCards } from '@/components/manage/section-cards';

import { getUserClubMembership } from '@/lib/rides/queries';
import { getAdminDashboardStats, getSectionCardStats } from '@/lib/manage/queries';
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

  const [stats, sectionStats] = await Promise.all([
    getAdminDashboardStats(membership.club_id),
    getSectionCardStats(membership.club_id),
  ]);

  return (
    <DashboardShell>
      <PageHeader centered={false} title={content.heading} />
      <div className="mt-6 min-w-0 space-y-8">
        <StatsBento
          stats={[
            {
              icon: Bicycle,
              title: content.stats.fillRate,
              value: stats.fillRate,
              suffix: '%',
              visualization: {
                type: 'trend',
                direction: stats.fillRateChange >= 0 ? 'up' : 'down',
                label: content.stats.fillRateContext(Math.abs(stats.fillRateChange)),
                sentiment: 'neutral',
              },
            },
            {
              icon: UserCircleMinus,
              title: content.stats.cancellationRate,
              value: stats.cancellationRate,
              suffix: '%',
              decimals: 1,
              visualization: {
                type: 'trend',
                direction: 'up',
                label: content.stats.cancellationContext(stats.cancellationsThisMonth),
                sentiment: 'neutral',
              },
            },
            {
              icon: UsersThree,
              title: content.stats.activeMembers,
              value: sectionStats.activeMembers,
              visualization: {
                type: 'trend',
                direction: 'up',
                label: content.stats.activeMembersContext(
                  new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  }),
                ),
                sentiment: 'positive',
              },
            },
          ]}
        />
        <SectionCards stats={sectionStats} clubId={membership.club_id} />
      </div>
    </DashboardShell>
  );
}
