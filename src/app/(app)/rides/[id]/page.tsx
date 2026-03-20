import { notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  MapPin,
  Path,
  Users,
  Mountains,
  ArrowSquareOut,
  CloudRain,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Copy } from '@phosphor-icons/react/dist/ssr';
import {
  getRideById,
  getUserSignupStatus,
  getRideSignups,
  getUserClubMembership,
} from '@/lib/rides/queries';
import { SignupButton } from '@/components/rides/signup-button';
import { SignupRoster } from '@/components/rides/signup-roster';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CapacityBar } from '@/components/ui/capacity-bar';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import { RideStatus, SignupStatus } from '@/config/statuses';
import { dateFormats, separators, units } from '@/config/formatting';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { detail, status: ridesStatus } = appContent.rides;

interface RideDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RideDetailPage({ params }: RideDetailPageProps) {
  const { id } = await params;
  const [ride, signup, signups, membership] = await Promise.all([
    getRideById(id),
    getUserSignupStatus(id),
    getRideSignups(id),
    getUserClubMembership(),
  ]);
  if (!ride) notFound();

  const rideDate = parseISO(ride.ride_date);
  const isSignedUp =
    signup?.status === SignupStatus.CONFIRMED || signup?.status === SignupStatus.WAITLISTED;
  const isCancelled = ride.status === RideStatus.CANCELLED;

  const userRole = (membership?.role as UserRole) ?? 'rider';
  const isCreator = membership?.user_id === ride.created_by;
  const canEdit = userRole === 'admin' || (userRole === 'ride_leader' && isCreator);

  // Separate confirmed from waitlisted for accurate display
  const confirmedCount = signups.filter(
    (s) => s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.CHECKED_IN,
  ).length;
  const waitlistedCount = signups.filter((s) => s.status === SignupStatus.WAITLISTED).length;

  let spotsText: string;
  if (ride.capacity == null) {
    spotsText = detail.signedUpCount(confirmedCount);
  } else if (confirmedCount < ride.capacity) {
    spotsText = detail.spotsRemaining(ride.capacity - confirmedCount, ride.capacity);
  } else {
    const parts = [detail.confirmedCount(confirmedCount)];
    if (waitlistedCount > 0) parts.push(detail.waitlistedCount(waitlistedCount));
    spotsText = parts.join(separators.dot);
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      {/* Status Banners */}
      {ride.status === RideStatus.WEATHER_WATCH && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-warning/20 bg-warning/10 px-5 py-4 text-base text-warning">
          <CloudRain className="h-5 w-5 shrink-0" />
          {ridesStatus.weatherWatchDescription}
        </div>
      )}
      {isCancelled && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-base text-destructive">
          {detail.cancelled}
          {ride.cancellation_reason && ` — ${ride.cancellation_reason}`}
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight text-foreground">{ride.title}</h1>

      <p className="mt-3 text-lg text-foreground/90">
        {format(rideDate, dateFormats.full)}
        <span className="mx-2 text-muted-foreground/50">·</span>
        <span className="tabular-nums">{ride.start_time.slice(0, 5)}</span>
        {ride.end_time && (
          <span className="tabular-nums">
            {separators.dash}
            {ride.end_time.slice(0, 5)}
          </span>
        )}
      </p>

      {ride.pace_group && (
        <p className="mt-1.5 text-base text-muted-foreground">
          {ride.pace_group.name}
          {ride.pace_group.moving_pace_min && ride.pace_group.moving_pace_max
            ? ` (${ride.pace_group.moving_pace_min}–${ride.pace_group.moving_pace_max}${units.kmh})`
            : ''}
          {`${separators.dot}${ride.is_drop_ride ? detail.dropRide : detail.noDrop}`}
        </p>
      )}

      {ride.creator && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          <Link
            href={routes.publicProfile(ride.creator.id)}
            className="hover:text-foreground transition-colors"
          >
            {detail.createdBy(ride.creator.display_name ?? ride.creator.full_name)}
          </Link>
        </p>
      )}

      {/* Edit / Duplicate actions for authorized users */}
      {canEdit && (
        <div className="mt-4 flex gap-2">
          {!isCancelled && (
            <Link href={routes.manageEditRide(ride.id)}>
              <Button variant="outline" size="sm">
                {appContent.rides.edit.heading}
              </Button>
            </Link>
          )}
          {isCancelled && (
            <Link href={`${routes.manageNewRide}?duplicate=${ride.id}`}>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-1.5" />
                {detail.duplicateAsNew}
              </Button>
            </Link>
          )}
        </div>
      )}

      {ride.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {ride.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-sm"
              style={
                tag.color
                  ? {
                      backgroundColor: `color-mix(in srgb, ${tag.color} 15%, transparent)`,
                      color: tag.color,
                    }
                  : undefined
              }
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Details */}
      <div className="mt-8 space-y-3">
        {ride.meeting_location && (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground text-base">{ride.meeting_location.name}</p>
              {ride.meeting_location.address && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {ride.meeting_location.address}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-5">
          {ride.distance_km != null && (
            <span className="flex items-center gap-2 text-base font-medium text-info">
              <Path className="h-5 w-5" />
              {ride.distance_km}
              {units.km}
            </span>
          )}
          {ride.elevation_m != null && (
            <span className="flex items-center gap-2 text-base font-medium text-info">
              <Mountains className="h-5 w-5" />
              {ride.elevation_m}
              {units.m}
            </span>
          )}
          <span className="flex items-center gap-2 text-base font-medium">
            <Users className="h-5 w-5 text-muted-foreground" />
            {spotsText}
          </span>
        </div>

        {isSignedUp && <p className="text-base font-semibold text-primary">{detail.signedUp}</p>}
      </div>

      {ride.route_url && (
        <div className="mt-8">
          <a
            href={ride.route_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-base font-semibold text-info hover:underline underline-offset-2"
          >
            <ArrowSquareOut className="h-5 w-5" />
            {ride.route_name ?? detail.viewRoute}
          </a>
        </div>
      )}

      {ride.organiser_notes && (
        <div className="mt-8">
          <SectionHeading>
            {detail.organiserNotesHeading}
          </SectionHeading>
          <p className="mt-3 text-base text-foreground/80 whitespace-pre-line leading-relaxed">
            {ride.organiser_notes}
          </p>
        </div>
      )}

      {/* Signed-up riders */}
      {signups.length > 0 && (
        <div className="mt-8">
          <SectionHeading>
            {detail.ridersHeading(confirmedCount, waitlistedCount, ride.capacity)}
          </SectionHeading>
          <div className="mt-3 rounded-xl border border-border bg-card p-3">
            <SignupRoster signups={signups} createdBy={ride.created_by} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <CapacityBar signupCount={confirmedCount} capacity={ride.capacity} className="mb-5" />
        <SignupButton
          rideId={ride.id}
          isSignedUp={isSignedUp}
          isCancelled={isCancelled}
          isFull={ride.capacity != null && confirmedCount >= ride.capacity}
        />
      </div>
    </div>
  );
}
