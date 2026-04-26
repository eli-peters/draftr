import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { getUserClubMembership } from '@/lib/rides/queries';
import { getClubAnnouncements } from '@/lib/manage/queries';
import {
  AnnouncementsPanel,
  CreateAnnouncementButton,
} from '@/components/manage/announcements-panel';
import { MobileGate } from '@/components/manage/mobile-gate';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { manage: content } = appContent;

export default async function ManageAnnouncementsPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  if (userRole !== 'admin') redirect(routes.manageRides);

  const announcements = await getClubAnnouncements(membership.club_id);

  return (
    <MobileGate>
      <DashboardShell>
        <PageHeader
          title={content.announcements.heading}
          actions={
            <span className="hidden md:block">
              <CreateAnnouncementButton clubId={membership.club_id} />
            </span>
          }
        />
        <div className="mt-2">
          <AnnouncementsPanel announcements={announcements} clubId={membership.club_id} />
        </div>
      </DashboardShell>
    </MobileGate>
  );
}
