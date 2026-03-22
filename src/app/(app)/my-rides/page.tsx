import { redirect } from 'next/navigation';
import { getUserClubMembership, getUserRideSignups } from '@/lib/rides/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { MyScheduleSections } from './my-schedule-sections';

const { schedule } = appContent;

export default async function MySchedulePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userId = membership.user_id;

  const [upcoming, past, waitlisted] = await Promise.all([
    getUserRideSignups(userId, membership.club_id, 'upcoming'),
    getUserRideSignups(userId, membership.club_id, 'past'),
    getUserRideSignups(userId, membership.club_id, 'waitlisted'),
  ]);

  // Merge confirmed (upcoming) + waitlisted into a single list, sorted by date
  const upcomingAll = [...upcoming, ...waitlisted].sort(
    (a, b) => a.ride_date.localeCompare(b.ride_date) || a.start_time.localeCompare(b.start_time),
  );

  return (
    <DashboardShell>
      <PageHeader title={schedule.heading} />
      <MyScheduleSections upcoming={upcomingAll} past={past} />
    </DashboardShell>
  );
}
