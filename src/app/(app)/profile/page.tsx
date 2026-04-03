import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Path, CaretRight, SignOut } from '@phosphor-icons/react/dist/ssr';
import { createClient, getUser } from '@/lib/supabase/server';
import { signOut } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppearanceSetting } from '@/components/settings/appearance-setting';
import { IntegrationsSetting } from '@/components/settings/integrations-setting';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { getInitials } from '@/lib/utils';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ContentCard } from '@/components/ui/content-card';
import { dateFormats, units } from '@/config/formatting';
import { getUserProfile, getUserProfileStats, getUserRecentRides } from '@/lib/profile/queries';
import { getUserConnections } from '@/lib/integrations/queries';
import { ProfileAvatarEditor } from '@/components/profile/profile-avatar-editor';
import { ProfileDetailsForm } from '@/components/profile/profile-details-form';

const { profile: content } = appContent;

export default async function ProfilePage() {
  const authUser = await getUser();
  if (!authUser) redirect(routes.signIn);

  const supabase = await createClient();

  const [profile, stats, recentRides, connections, { data: paceGroups }] = await Promise.all([
    getUserProfile(authUser.id),
    getUserProfileStats(authUser.id),
    getUserRecentRides(authUser.id),
    getUserConnections(authUser.id),
    supabase.from('pace_groups').select('id, name').order('sort_order', { ascending: true }),
  ]);

  if (!profile) redirect(routes.signIn);

  const displayName = profile.full_name;
  const initials = getInitials(profile.full_name);
  const memberSince = format(new Date(profile.created_at), dateFormats.monthYear);
  const role = profile.role as keyof typeof content.roles;

  return (
    <DashboardShell>
      {/* Hero: Avatar + identity */}
      <div className="flex flex-col items-center text-center">
        <ProfileAvatarEditor
          avatarUrl={profile.avatar_url}
          fullName={profile.full_name}
          initials={initials}
        />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
        <Badge variant="default" className="mt-2">
          {content.roles[role] ?? role}
        </Badge>
      </div>

      {/* Stat Strip */}
      <ContentCard className="mt-8" padding="compact">
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="flex flex-col items-center px-2">
            <span className="font-mono text-xl font-bold tabular-nums text-foreground">
              {stats.totalRides}
            </span>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">
              {content.stats.totalRides}
            </p>
          </div>
          <div className="flex flex-col items-center px-2">
            <span className="font-mono text-xl font-bold tabular-nums text-foreground">
              {stats.ridesThisMonth}
            </span>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">
              {content.stats.thisMonth}
            </p>
          </div>
          <div className="flex flex-col items-center px-2">
            <span className="font-mono text-xl font-bold tabular-nums text-foreground">
              {memberSince}
            </span>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">
              {content.sections.memberSince}
            </p>
          </div>
        </div>
      </ContentCard>

      {/* Editable profile details */}
      <div className="mt-8">
        <ProfileDetailsForm
          bio={profile.bio ?? ''}
          preferredPaceGroup={profile.preferred_pace_group ?? ''}
          emergencyContactName={profile.emergency_contact_name ?? ''}
          emergencyContactPhone={profile.emergency_contact_phone ?? ''}
          paceGroups={paceGroups ?? []}
        />
      </div>

      {/* Appearance */}
      <div className="mt-8">
        <AppearanceSetting />
      </div>

      {/* Connected Services — only for leaders and admins (used for ride import) */}
      {(role === 'ride_leader' || role === 'admin') && (
        <div className="mt-8">
          <IntegrationsSetting connections={connections} />
        </div>
      )}

      {/* Recent Rides */}
      <ContentCard heading={content.recentRides} className="mt-8">
        {recentRides.length === 0 ? (
          <p className="text-base text-muted-foreground">{content.noRidesYet}</p>
        ) : (
          <div className="divide-y divide-border">
            {recentRides.map((ride) => (
              <Link
                key={ride.id}
                href={routes.ride(ride.id)}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group"
              >
                <div className="min-w-0">
                  <p className="text-base font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {ride.title}
                  </p>
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
              </Link>
            ))}
          </div>
        )}
      </ContentCard>

      {/* Sign Out */}
      <div className="mt-12 flex justify-center">
        <form action={signOut}>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <SignOut className="h-4 w-4" />
            {content.signOut}
          </Button>
        </form>
      </div>
    </DashboardShell>
  );
}
