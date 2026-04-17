import { redirect } from 'next/navigation';
import {
  getUpcomingRides,
  getUserClubMembership,
  getPaceGroups,
  getRidesForMonth,
} from '@/lib/rides/queries';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { RidesCalendar } from '@/components/rides/calendar/rides-calendar';

export default async function RidesPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const timezone = membership.club.timezone;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [allRides, paceGroups, monthRides] = await Promise.all([
    getUpcomingRides(membership.club_id, membership.user_id, timezone),
    getPaceGroups(membership.club_id),
    getRidesForMonth(membership.club_id, membership.user_id, year, month),
  ]);

  // Filter out rides that have already completed (past their end_time today)
  const rides = allRides.filter(
    (r) => getRideLifecycle(r.ride_date, r.start_time, r.end_time, timezone) !== 'completed',
  );

  return (
    <DashboardShell>
      <RidesCalendar
        initialMonthRides={monthRides}
        upcomingRides={rides}
        paceGroups={paceGroups}
        timezone={timezone}
      />
    </DashboardShell>
  );
}
