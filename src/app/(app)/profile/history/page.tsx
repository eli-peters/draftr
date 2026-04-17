import { redirect } from 'next/navigation';
import { getUserClubMembership, getUserRideSignups } from '@/lib/rides/queries';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { Club } from '@/types/database';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { RideHistoryList } from './ride-history-list';

const { profile: profileContent } = appContent;

export default async function RideHistoryPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const timezone = (membership.club as unknown as Club).timezone;
  const userId = membership.user_id;

  const [pastRaw, upcomingRaw, waitlistedRaw] = await Promise.all([
    getUserRideSignups(userId, membership.club_id, 'past', timezone),
    getUserRideSignups(userId, membership.club_id, 'upcoming', timezone),
    getUserRideSignups(userId, membership.club_id, 'waitlisted', timezone),
  ]);

  // Post-filter: rides past their end_time today move to "past"
  const isCompleted = (r: { ride_date: string; start_time: string; end_time: string | null }) =>
    getRideLifecycle(r.ride_date, r.start_time, r.end_time, timezone) === 'completed';

  const completedToday = [
    ...upcomingRaw.filter(isCompleted).map((r) => ({ ...r, signup_status: 'completed' as const })),
    ...waitlistedRaw
      .filter(isCompleted)
      .map((r) => ({ ...r, signup_status: 'completed' as const })),
  ];

  const past = [...completedToday, ...pastRaw].sort(
    (a, b) => b.ride_date.localeCompare(a.ride_date) || b.start_time.localeCompare(a.start_time),
  );

  return (
    <DashboardShell>
      <PageHeader title={profileContent.history.heading} />
      <RideHistoryList rides={past} timezone={timezone} />
    </DashboardShell>
  );
}
