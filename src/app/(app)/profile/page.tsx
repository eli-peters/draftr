import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Path, CaretRight, Bicycle, ArrowUp, ArrowDown } from '@phosphor-icons/react/dist/ssr';
import { createClient, getUser } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { ContentCard } from '@/components/ui/content-card';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { getInitials } from '@/lib/utils';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { dateFormats, units } from '@/config/formatting';
import { getUserProfile, getUserProfileStats, getUserRecentRides } from '@/lib/profile/queries';
import { ProfileAvatarEditor } from '@/components/profile/profile-avatar-editor';
import { ProfileAboutSection } from '@/components/profile/profile-about-section';
import { ProfilePaceSection } from '@/components/profile/profile-pace-section';
import { ProfileContactSection } from '@/components/profile/profile-contact-section';

const { profile: content } = appContent;

export default async function ProfilePage() {
  const authUser = await getUser();
  if (!authUser) redirect(routes.signIn);

  const supabase = await createClient();

  const [profile, stats, recentRides, { data: paceGroups }] = await Promise.all([
    getUserProfile(authUser.id),
    getUserProfileStats(authUser.id),
    getUserRecentRides(authUser.id),
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
        <p className="text-sm text-muted-foreground">
          {content.sections.memberSince} {memberSince}
        </p>
        <Badge variant="default" className="mt-2">
          {content.roles[role] ?? role}
        </Badge>
      </div>

      {/* Stat Strip — 2 columns: Total Rides | Rides This Month + delta */}
      <ContentCard className="mt-8" padding="compact">
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="flex flex-col items-center px-2">
            <span className="font-mono text-xl font-bold tabular-nums text-foreground">
              {stats.totalRides}
            </span>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">
              {content.stats.totalRides}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 px-2">
            <div className="flex flex-col items-center">
              <span className="font-mono text-xl font-bold tabular-nums text-foreground">
                {stats.ridesThisMonth}
              </span>
              <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">
                {content.stats.thisMonth}
              </p>
            </div>
            {stats.ridesThisMonth !== stats.ridesLastMonth && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  stats.ridesThisMonth > stats.ridesLastMonth
                    ? 'bg-feedback-success-bg text-feedback-success-text'
                    : 'bg-feedback-warning-bg text-feedback-warning-text'
                }`}
              >
                {stats.ridesThisMonth > stats.ridesLastMonth ? (
                  <ArrowUp className="h-3 w-3" weight="bold" />
                ) : (
                  <ArrowDown className="h-3 w-3" weight="bold" />
                )}
                {content.stats.delta(stats.ridesThisMonth - stats.ridesLastMonth)}
              </span>
            )}
          </div>
        </div>
      </ContentCard>

      {/* About — inline editable */}
      <ProfileAboutSection bio={profile.bio ?? ''} />

      {/* Pace Group — inline editable */}
      <ProfilePaceSection
        preferredPaceGroup={profile.preferred_pace_group ?? ''}
        paceGroups={paceGroups ?? []}
      />

      {/* Contact Information + Emergency Contact — inline editable */}
      <ProfileContactSection
        fullName={profile.full_name}
        email={profile.email}
        phoneNumber={profile.phone_number ?? ''}
        emergencyName={profile.emergency_contact_name ?? ''}
        emergencyPhone={profile.emergency_contact_phone ?? ''}
        emergencyRelationship={profile.emergency_contact_relationship ?? ''}
      />

      {/* Ride History */}
      <ContentCard className="mt-8" icon={Bicycle} heading={content.recentRides}>
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
    </DashboardShell>
  );
}
