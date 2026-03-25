import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Bicycle, Path, CaretRight, FirstAidKit } from '@phosphor-icons/react/dist/ssr';
import { createClient, getUser } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AppearanceSetting } from '@/components/settings/appearance-setting';
import { IntegrationsSetting } from '@/components/settings/integrations-setting';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import { formatPhoneDisplay } from '@/lib/phone';
import { routes } from '@/config/routes';
import { getInitials } from '@/lib/utils';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { dateFormats, units } from '@/config/formatting';
import { getUserProfile, getUserProfileStats, getUserRecentRides } from '@/lib/profile/queries';
import { getUserConnections } from '@/lib/integrations/queries';

const { profile: content } = appContent;

export default async function ProfilePage() {
  const authUser = await getUser();
  if (!authUser) redirect(routes.signIn);

  const supabase = await createClient();
  const [profile, stats, recentRides, emergencyContact, connections] = await Promise.all([
    getUserProfile(authUser.id),
    getUserProfileStats(authUser.id),
    getUserRecentRides(authUser.id),
    supabase
      .from('users')
      .select('emergency_contact_name, emergency_contact_phone')
      .eq('id', authUser.id)
      .single(),
    getUserConnections(authUser.id),
  ]);

  if (!profile) redirect(routes.signIn);
  const ec = emergencyContact.data;

  const displayName = profile.display_name ?? profile.full_name;
  const initials = getInitials(profile.full_name);
  const memberSince = format(new Date(profile.created_at), dateFormats.monthYear);
  const role = profile.role as keyof typeof content.roles;

  return (
    <DashboardShell>
      {/* Hero: Centered avatar */}
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 ring-2 ring-primary/20">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
        <p className="text-base text-muted-foreground">{profile.email}</p>
        <Badge variant="default" className="mt-2">
          {content.roles[role] ?? role}
        </Badge>
        <Link href={routes.profileEdit}>
          <Button variant="outline" size="sm" className="mt-4">
            {content.editButton}
          </Button>
        </Link>
      </div>

      {/* Stat Strip */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="flex flex-col items-center px-2">
            <span className="text-xl font-bold tabular-nums text-foreground">
              {stats.totalRides}
            </span>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">
              {content.stats.totalRides}
            </p>
          </div>
          <div className="flex flex-col items-center px-2">
            <span className="text-xl font-bold tabular-nums text-foreground">
              {stats.ridesThisMonth}
            </span>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">
              {content.stats.thisMonth}
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
      <div className="mt-8">
        <SectionHeading>{content.sections.about}</SectionHeading>
        {profile.bio ? (
          <p className="mt-3 text-base text-foreground/75 leading-relaxed">{profile.bio}</p>
        ) : (
          <p className="mt-3 text-base text-muted-foreground italic">{content.noBio}</p>
        )}
      </div>

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

      {/* Emergency Contact */}
      <div className="mt-8">
        <SectionHeading>{content.sections.emergencyContact}</SectionHeading>
        {ec?.emergency_contact_name ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-5">
            <FirstAidKit className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-foreground text-base">{ec.emergency_contact_name}</p>
              {ec.emergency_contact_phone && (
                <p className="text-sm text-muted-foreground">
                  {formatPhoneDisplay(ec.emergency_contact_phone)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-base text-muted-foreground italic">
            {content.emergencyContact.noContact}
          </p>
        )}
      </div>

      {/* Appearance */}
      <div className="mt-8">
        <AppearanceSetting />
      </div>

      {/* Connected Services */}
      <div className="mt-8">
        <IntegrationsSetting connections={connections} />
      </div>

      {/* Recent Rides */}
      <div className="mt-8">
        <SectionHeading>{content.recentRides}</SectionHeading>
        {recentRides.length === 0 ? (
          <p className="mt-3 text-base text-muted-foreground">{content.noRidesYet}</p>
        ) : (
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
        )}
      </div>
    </DashboardShell>
  );
}
