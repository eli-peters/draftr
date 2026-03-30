import { redirect } from 'next/navigation';
import { getUserClubMembership, getUserRideSignups } from '@/lib/rides/queries';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { Club } from '@/types/database';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { MyScheduleSections } from './my-schedule-sections';

const { schedule } = appContent;

export default async function MySchedulePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const timezone = (membership.club as unknown as Club).timezone;
  const userId = membership.user_id;

  const [upcomingRaw, pastRaw, waitlistedRaw] = await Promise.all([
    getUserRideSignups(userId, membership.club_id, 'upcoming'),
    getUserRideSignups(userId, membership.club_id, 'past'),
    getUserRideSignups(userId, membership.club_id, 'waitlisted'),
  ]);

  // Post-filter: rides past their end_time today should move to "past"
  const isCompleted = (r: { ride_date: string; start_time: string; end_time: string | null }) =>
    getRideLifecycle(r.ride_date, r.start_time, r.end_time, timezone) === 'completed';

  const upcoming = upcomingRaw.filter((r) => !isCompleted(r));
  const waitlisted = waitlistedRaw.filter((r) => !isCompleted(r));
  const completedToday = [
    ...upcomingRaw.filter(isCompleted).map((r) => ({ ...r, signup_status: 'completed' as const })),
    ...waitlistedRaw
      .filter(isCompleted)
      .map((r) => ({ ...r, signup_status: 'completed' as const })),
  ];
  const past = [...completedToday, ...pastRaw].sort(
    (a, b) => b.ride_date.localeCompare(a.ride_date) || b.start_time.localeCompare(a.start_time),
  );

  // Merge confirmed (upcoming) + waitlisted into a single list, sorted by date
  const upcomingAll = [...upcoming, ...waitlisted].sort(
    (a, b) => a.ride_date.localeCompare(b.ride_date) || a.start_time.localeCompare(b.start_time),
  );

  return (
    <DashboardShell>
      <PageHeader title={schedule.heading} />
      <MyScheduleSections upcoming={upcomingAll} past={past} timezone={timezone} />
    </DashboardShell>
  );
}
