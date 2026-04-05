import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { getUserClubMembership, getPaceGroups } from '@/lib/rides/queries';
import { getClubMembers } from '@/lib/manage/queries';
import { InviteMemberDrawer } from '@/components/manage/invite-member-drawer';
import { MemberList } from '@/components/manage/member-list';
import { MobileGate } from '@/components/manage/mobile-gate';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { manage: content } = appContent;

export default async function ManageMembersPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  if (userRole !== 'admin') redirect(routes.manageRides);

  const [members, paceGroups] = await Promise.all([
    getClubMembers(membership.club_id),
    getPaceGroups(membership.club_id),
  ]);

  return (
    <MobileGate>
      <DashboardShell>
        <PageHeader
          centered={false}
          title={content.members.heading}
          actions={<InviteMemberDrawer clubId={membership.club_id} />}
        />
        <div className="mt-4">
          <MemberList
            members={members}
            clubId={membership.club_id}
            currentUserId={membership.user_id}
            paceGroups={paceGroups}
          />
        </div>
      </DashboardShell>
    </MobileGate>
  );
}
