import { redirect } from 'next/navigation';
import { getUserClubMembership, getUserRideSignups } from '@/lib/rides/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { MyScheduleSections } from './my-schedule-sections';

const { myRides } = appContent;

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
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{myRides.heading}</h1>
      <MyScheduleSections upcoming={upcomingAll} past={past} />
    </div>
  );
}
