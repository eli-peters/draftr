import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { getUserClubMembership, getLeaderRides, getPaceGroups } from '@/lib/rides/queries';
import { ManageRidesPanel } from '@/components/manage/manage-rides-panel';
import { MobileGate } from '@/components/manage/mobile-gate';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { manage: content } = appContent;

export default async function ManageRidesPage({
  searchParams,
}: {
  searchParams: Promise<{ pace?: string }>;
}) {
  const params = await searchParams;
  const initialPaceFilter = params.pace ?? null;

  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  const isAdmin = userRole === 'admin';

  const [rides, paceGroups] = await Promise.all([
    getLeaderRides(membership.user_id, membership.club_id, isAdmin),
    getPaceGroups(membership.club_id),
  ]);

  return (
    <MobileGate>
      <DashboardShell>
        <PageHeader
          centered={false}
          title={isAdmin ? content.headingAdmin : content.headingLeader}
          actions={
            <Link href={routes.manageNewRide}>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                {content.rides.createRide}
              </Button>
            </Link>
          }
        />
        <ManageRidesPanel
          rides={rides}
          paceGroups={paceGroups}
          initialPaceFilter={initialPaceFilter}
          isLeader={!isAdmin}
        />
      </DashboardShell>
    </MobileGate>
  );
}
