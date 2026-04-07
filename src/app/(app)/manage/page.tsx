import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ManageStatsBento } from '@/components/manage/manage-stats-bento';
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
        <ManageStatsBento
          fillRate={stats.fillRate}
          fillRateChange={stats.fillRateChange}
          cancellationRate={stats.cancellationRate}
          cancellationsThisMonth={stats.cancellationsThisMonth}
          activeMembers={sectionStats.activeMembers}
        />
        <SectionCards stats={sectionStats} clubId={membership.club_id} />
      </div>
    </DashboardShell>
  );
}
