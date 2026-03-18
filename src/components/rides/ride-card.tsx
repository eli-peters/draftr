import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  MapPin,
  Path,
  Users,
  Mountains,
  CloudRain,
  ArrowsClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { appContent } from "@/content/app";
import { getRelativeDay } from "@/lib/utils";
import type { RideWithDetails } from "@/types/database";

const { rides: ridesContent } = appContent;

interface RideCardProps {
  ride: RideWithDetails;
  featured?: boolean;
}

export function RideCard({ ride }: RideCardProps) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, "EEE");
  const spotsText =
    ride.capacity != null
      ? `${ride.signup_count}/${ride.capacity}`
      : `${ride.signup_count}`;
  const capacityPercent =
    ride.capacity != null ? (ride.signup_count / ride.capacity) * 100 : null;

  return (
    <Link href={`/rides/${ride.id}`} className="group block">
      <div className="rounded-xl border border-border bg-card p-6 mb-4">

        {/* Date + time + status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary uppercase tracking-wide">
            {relativeDay} · {format(rideDate, "MMM d")}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {ride.start_time.slice(0, 5)}
          </span>
          {ride.template_id && (
            <ArrowsClockwise weight="bold" className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
          {ride.status === "weather_watch" && (
            <Badge variant="outline" className="text-warning border-warning/50 gap-1">
              <CloudRain weight="fill" className="h-3.5 w-3.5" />
              {ridesContent.status.weatherWatch}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-lg font-bold text-foreground leading-tight">
          {ride.title}
        </h3>

        {/* Pace Group */}
        {ride.pace_group && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {ride.pace_group.name}
            {ride.is_drop_ride && (
              <span className="ml-1 text-destructive/70">· Drop</span>
            )}
          </p>
        )}

        {/* Details Row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {ride.meeting_location && (
            <span className="flex items-center gap-1.5">
              <MapPin weight="fill" className="h-4 w-4" />
              {ride.meeting_location.name}
            </span>
          )}
          {ride.distance_km != null && (
            <span className="flex items-center gap-1.5 text-info">
              <Path weight="bold" className="h-4 w-4" />
              {ride.distance_km} km
            </span>
          )}
          {ride.elevation_m != null && (
            <span className="flex items-center gap-1.5 text-info">
              <Mountains weight="fill" className="h-4 w-4" />
              {ride.elevation_m} m
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users weight="fill" className="h-4 w-4" />
            {spotsText}
          </span>
        </div>

        {/* Tags */}
        {ride.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ride.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-sm px-2.5"
                style={
                  tag.color
                    ? { backgroundColor: `${tag.color}15`, color: tag.color }
                    : undefined
                }
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Capacity line */}
        {capacityPercent != null && (
          <div className="mt-5 h-0.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
