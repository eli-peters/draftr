import { redirect } from 'next/navigation';
import { getUserClubMembership, getUserRideSignups } from '@/lib/rides/queries';
import { createClient } from '@/lib/supabase/server';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { MyRidesTabs } from './my-rides-tabs';

const { myRides } = appContent;

export default async function MyRidesPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.signIn);

  const [upcoming, past, waitlisted] = await Promise.all([
    getUserRideSignups(user.id, membership.club_id, 'upcoming'),
    getUserRideSignups(user.id, membership.club_id, 'past'),
    getUserRideSignups(user.id, membership.club_id, 'waitlisted'),
  ]);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{myRides.heading}</h1>
      <MyRidesTabs upcoming={upcoming} past={past} waitlisted={waitlisted} />
    </div>
  );
}
