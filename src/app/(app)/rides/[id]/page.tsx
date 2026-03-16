import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  MapPin,
  Path,
  Users,
  Mountains,
  ArrowSquareOut,
  CloudRain,
} from "@phosphor-icons/react/dist/ssr";
import { getRideById, getUserSignupStatus } from "@/lib/rides/queries";
import { SignupButton } from "@/components/rides/signup-button";
import { Badge } from "@/components/ui/badge";
import { appContent } from "@/content/app";

const { detail, status: ridesStatus } = appContent.rides;

interface RideDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RideDetailPage({ params }: RideDetailPageProps) {
  const { id } = await params;
  const [ride, signup] = await Promise.all([getRideById(id), getUserSignupStatus(id)]);
  if (!ride) notFound();

  const rideDate = parseISO(ride.ride_date);
  const isSignedUp = signup?.status === "confirmed" || signup?.status === "waitlisted";
  const isCancelled = ride.status === "cancelled";
  const spotsText =
    ride.capacity != null
      ? detail.spotsRemaining(ride.capacity - ride.signup_count, ride.capacity)
      : `${ride.signup_count} signed up`;
  const capacityPercent =
    ride.capacity != null ? (ride.signup_count / ride.capacity) * 100 : null;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      {/* Status Banners */}
      {ride.status === "weather_watch" && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-base text-amber-300">
          <CloudRain weight="fill" className="h-5 w-5 shrink-0" />
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
        {format(rideDate, "EEEE, MMMM d, yyyy")}
        <span className="mx-2 text-muted-foreground/50">·</span>
        <span className="tabular-nums">{ride.start_time.slice(0, 5)}</span>
        {ride.end_time && <span className="tabular-nums"> – {ride.end_time.slice(0, 5)}</span>}
      </p>

      {ride.pace_group && (
        <p className="mt-1.5 text-base text-muted-foreground">
          {ride.pace_group.name}
          {ride.pace_group.moving_pace_min && ride.pace_group.moving_pace_max
            ? ` (${ride.pace_group.moving_pace_min}–${ride.pace_group.moving_pace_max} km/h)`
            : ""}
          {ride.is_drop_ride ? " · Drop ride" : " · No-drop"}
        </p>
      )}

      {ride.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {ride.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-sm"
              style={tag.color ? { backgroundColor: `${tag.color}15`, color: tag.color } : undefined}>
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Details */}
      <div className="mt-8 space-y-3">
        {ride.meeting_location && (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
            <MapPin weight="fill" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground text-base">{ride.meeting_location.name}</p>
              {ride.meeting_location.address && (
                <p className="text-sm text-muted-foreground mt-0.5">{ride.meeting_location.address}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-5">
          {ride.distance_km != null && (
            <span className="flex items-center gap-2 text-base font-medium text-info">
              <Path weight="bold" className="h-5 w-5" />
              {ride.distance_km} km
            </span>
          )}
          {ride.elevation_m != null && (
            <span className="flex items-center gap-2 text-base font-medium text-info">
              <Mountains weight="fill" className="h-5 w-5" />
              {ride.elevation_m} m
            </span>
          )}
          <span className="flex items-center gap-2 text-base font-medium">
            <Users weight="fill" className="h-5 w-5 text-muted-foreground" />
            {spotsText}
          </span>
        </div>

        {isSignedUp && (
          <p className="text-base font-semibold text-primary">{detail.signedUp}</p>
        )}
      </div>

      {ride.route_url && (
        <div className="mt-8">
          <a href={ride.route_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-base font-semibold text-info hover:underline underline-offset-2">
            <ArrowSquareOut weight="bold" className="h-5 w-5" />
            {ride.route_name ?? "View Route"}
          </a>
        </div>
      )}

      {ride.organiser_notes && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes from the organiser</h2>
          <p className="mt-3 text-base text-foreground/80 whitespace-pre-line leading-relaxed">{ride.organiser_notes}</p>
        </div>
      )}

      <div className="mt-10">
        {capacityPercent != null && (
          <div className="mb-5 h-0.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
          </div>
        )}
        <SignupButton rideId={ride.id} isSignedUp={isSignedUp} isCancelled={isCancelled} />
      </div>
    </div>
  );
}
