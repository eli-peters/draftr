import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MapPin, Clock, Route, Users, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RideWithDetails } from "@/types/database";

interface RideCardProps {
  ride: RideWithDetails;
}

/**
 * Ride card for the feed. Shows key info at a glance.
 * Pure presentational component — all data via props.
 */
export function RideCard({ ride }: RideCardProps) {
  const rideDate = parseISO(ride.ride_date);
  const spotsText =
    ride.capacity != null
      ? `${ride.signup_count}/${ride.capacity}`
      : `${ride.signup_count}`;

  return (
    <Link href={`/rides/${ride.id}`}>
      <Card className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
        {/* Date + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">
              {format(rideDate, "EEE, MMM d")}
            </span>
            <span className="text-sm text-muted-foreground">
              {ride.start_time.slice(0, 5)}
            </span>
          </div>
          {ride.status === "weather_watch" && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Weather Watch
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-base font-semibold text-foreground leading-tight">
          {ride.title}
        </h3>

        {/* Pace Group */}
        {ride.pace_group && (
          <p className="mt-1 text-sm text-muted-foreground">
            {ride.pace_group.name}
            {ride.is_drop_ride && " (Drop)"}
          </p>
        )}

        {/* Details Row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {ride.meeting_location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {ride.meeting_location.name}
            </span>
          )}
          {ride.distance_km != null && (
            <span className="flex items-center gap-1">
              <Route className="h-3.5 w-3.5" />
              {ride.distance_km} km
            </span>
          )}
          {ride.elevation_m != null && (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {ride.elevation_m} m
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {spotsText} riders
          </span>
        </div>

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
      </Card>
    </Link>
  );
}
