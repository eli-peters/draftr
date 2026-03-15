import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { MapPin, Clock, Route, Users, TrendingUp, ExternalLink } from "lucide-react";
import { getRideById, getUserSignupStatus } from "@/lib/rides/queries";
import { SignupButton } from "@/components/rides/signup-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { appContent } from "@/content/app";

const { detail } = appContent.rides;

interface RideDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RideDetailPage({ params }: RideDetailPageProps) {
  const { id } = await params;
  const [ride, signup] = await Promise.all([
    getRideById(id),
    getUserSignupStatus(id),
  ]);

  if (!ride) {
    notFound();
  }

  const rideDate = parseISO(ride.ride_date);
  const isSignedUp = signup?.status === "confirmed" || signup?.status === "waitlisted";
  const isCancelled = ride.status === "cancelled";
  const spotsText =
    ride.capacity != null
      ? detail.spotsRemaining(ride.capacity - ride.signup_count, ride.capacity)
      : `${ride.signup_count} signed up`;

  return (
    <div className="flex flex-1 flex-col px-4 py-6 md:px-8">
      {/* Status Banner */}
      {ride.status === "weather_watch" && (
        <div className="mb-4 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Weather Watch — this ride may be affected by weather conditions.
        </div>
      )}
      {isCancelled && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {detail.cancelled}
          {ride.cancellation_reason && ` — ${ride.cancellation_reason}`}
        </div>
      )}

      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground">{ride.title}</h1>

      {/* Date & Time */}
      <p className="mt-2 text-base text-foreground">
        {format(rideDate, "EEEE, MMMM d, yyyy")}
        <span className="mx-2 text-muted-foreground">·</span>
        {ride.start_time.slice(0, 5)}
        {ride.end_time && ` – ${ride.end_time.slice(0, 5)}`}
      </p>

      {/* Pace Group */}
      {ride.pace_group && (
        <p className="mt-1 text-sm text-muted-foreground">
          {ride.pace_group.name}
          {ride.pace_group.moving_pace_min && ride.pace_group.moving_pace_max
            ? ` (${ride.pace_group.moving_pace_min}–${ride.pace_group.moving_pace_max} km/h)`
            : ""}
          {ride.is_drop_ride ? " · Drop ride" : " · No-drop"}
        </p>
      )}

      {/* Tags */}
      {ride.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ride.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs"
              style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="my-4" />

      {/* Details Grid */}
      <div className="grid gap-3 text-sm">
        {ride.meeting_location && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">{ride.meeting_location.name}</p>
              {ride.meeting_location.address && (
                <p className="text-muted-foreground">{ride.meeting_location.address}</p>
              )}
            </div>
          </div>
        )}

        {ride.distance_km != null && (
          <div className="flex items-center gap-3">
            <Route className="h-4 w-4 text-muted-foreground" />
            <span>{ride.distance_km} km</span>
            {ride.elevation_m != null && (
              <>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>{ride.elevation_m} m elevation</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{spotsText}</span>
        </div>

        {isSignedUp && (
          <p className="text-sm font-medium text-primary">{detail.signedUp}</p>
        )}
      </div>

      {/* Route Link */}
      {ride.route_url && (
        <>
          <Separator className="my-4" />
          <a
            href={ride.route_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {ride.route_name ?? "View Route"}
          </a>
        </>
      )}

      {/* Organiser Notes */}
      {ride.organiser_notes && (
        <>
          <Separator className="my-4" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Notes from the organiser</h2>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
              {ride.organiser_notes}
            </p>
          </div>
        </>
      )}

      {/* Sign Up Button — sticky on mobile */}
      <div className="mt-6 md:mt-8">
        <SignupButton
          rideId={ride.id}
          isSignedUp={isSignedUp}
          isCancelled={isCancelled}
        />
      </div>
    </div>
  );
}
