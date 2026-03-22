import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Bicycle, Path, CaretRight } from '@phosphor-icons/react/dist/ssr';
import { createClient, getUser } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { MemberStatus } from '@/config/statuses';
import { getInitials } from '@/lib/utils';
import { dateFormats, units } from '@/config/formatting';
import { getUserProfile, getUserProfileStats, getUserRecentRides } from '@/lib/profile/queries';

const { profile: content } = appContent;

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  // Ensure the viewer is authenticated
  const authUser = await getUser();
  if (!authUser) redirect(routes.signIn);

  const supabase = await createClient();

  // If viewing your own profile, redirect to the main profile page
  if (authUser.id === userId) redirect(routes.profile);

  // Check if user exists and their membership status
  const { data: membership } = await supabase
    .from('club_memberships')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  // Deactivated member state
  if (membership?.status === MemberStatus.INACTIVE) {
    const { data: basicUser } = await supabase
      .from('users')
      .select('full_name, display_name, avatar_url')
      .eq('id', userId)
      .single();

    const name = basicUser?.display_name ?? basicUser?.full_name ?? 'Member';
    const initials = getInitials(name);

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <Avatar className="h-24 w-24 opacity-muted">
          {basicUser?.avatar_url && <AvatarImage src={basicUser.avatar_url} alt={name} />}
          <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{name}</h1>
        <p className="mt-2 text-base text-muted-foreground">{content.publicProfile.deactivated}</p>
      </div>
    );
  }

  // Fetch public profile data
  const [profile, stats, recentRides] = await Promise.all([
    getUserProfile(userId),
    getUserProfileStats(userId),
    getUserRecentRides(userId),
  ]);

  if (!profile) notFound();

  const displayName = profile.display_name ?? profile.full_name;
  const initials = getInitials(profile.full_name);
  const memberSince = format(new Date(profile.created_at), dateFormats.monthYear);
  const role = profile.role as keyof typeof content.roles;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      {/* Hero: Centered avatar */}
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 ring-2 ring-primary/20">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
        <Badge variant="default" className="mt-2">
          {content.roles[role] ?? role}
        </Badge>
      </div>

      {/* Stat Strip */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="flex flex-col items-center px-2">
            <span className="text-xl font-bold tabular-nums text-foreground">
              {stats.totalRides}
            </span>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">
              {content.stats.totalRides}
            </p>
          </div>
          <div className="flex flex-col items-center px-2">
            <span className="text-xl font-bold tabular-nums text-foreground">{memberSince}</span>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">
              {content.sections.memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* About */}
      {profile.bio && (
        <div className="mt-8">
          <SectionHeading>{content.sections.about}</SectionHeading>
          <p className="mt-3 text-base text-foreground/75 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Preferences */}
      {profile.preferred_pace_group && (
        <div className="mt-8">
          <SectionHeading>{content.sections.preferences}</SectionHeading>
          <div className="mt-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5">
              <Bicycle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{content.sections.paceGroup}</p>
                <p className="font-medium text-foreground text-base">
                  {profile.preferred_pace_group}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Rides */}
      {recentRides.length > 0 && (
        <div className="mt-8">
          <SectionHeading>{content.recentRides}</SectionHeading>
          <div className="mt-3 space-y-2">
            {recentRides.map((ride) => (
              <Link key={ride.id} href={routes.ride(ride.id)} className="block group">
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div className="min-w-0">
                    <p className="text-base font-medium text-foreground truncate">{ride.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{format(new Date(ride.ride_date), dateFormats.monthDay)}</span>
                      {ride.distance_km != null && (
                        <span className="flex items-center gap-1 text-info">
                          <Path className="h-3.5 w-3.5" />
                          {ride.distance_km}
                          {units.km}
                        </span>
                      )}
                    </div>
                  </div>
                  <CaretRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
