import { redirect } from 'next/navigation';
import { getUpcomingRides, getUserClubMembership, getRidesForMonth } from '@/lib/rides/queries';
import { routes } from '@/config/routes';
import { appContent } from '@/content/app';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { RidesCalendar } from '@/components/rides/calendar/rides-calendar';

export default async function RidesPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const timezone = membership.club.timezone;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [rides, monthRides] = await Promise.all([
    getUpcomingRides(membership.club_id, membership.user_id, timezone),
    getRidesForMonth(membership.club_id, membership.user_id, year, month),
  ]);

  return (
    <DashboardShell>
      {/*
       * Screen-reader-only H1. No visible page title by design — the bottom tab
       * bar communicates "you're on Rides," matching the homepage pattern and
       * native iOS apps (Calendar, Reminders, etc.). The sr-only H1 restores the
       * page landmark for heading-based SR navigation without adding visual
       * chrome. Swap to a visible heading if we ever decide the tab bar isn't
       * enough context on its own.
       */}
      <h1 className="sr-only">{appContent.nav.rides}</h1>
      <RidesCalendar initialMonthRides={monthRides} upcomingRides={rides} timezone={timezone} />
    </DashboardShell>
  );
}
