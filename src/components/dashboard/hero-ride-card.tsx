import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  MapPin,
  Path,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import { appContent } from "@/content/app";
import { getRelativeDay } from "@/lib/utils";
import type { RideWithDetails } from "@/types/database";

const { dashboard } = appContent;

export function HeroRideCard({ ride }: { ride: RideWithDetails }) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate);
  const spotsLeft =
    ride.capacity != null ? ride.capacity - ride.signup_count : null;
  const capacityPercent =
    ride.capacity != null ? (ride.signup_count / ride.capacity) * 100 : null;

  return (
    <Link href={`/rides/${ride.id}`} className="group block">
      <div className="relative rounded-xl border border-border bg-card p-6 overflow-hidden">
        {/* Day + Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary">
              {relativeDay}
            </span>
            <span className="text-base text-muted-foreground">
              {format(rideDate, "MMM d")} · {ride.start_time.slice(0, 5)}
            </span>
          </div>
          {spotsLeft != null && spotsLeft > 0 && (
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {dashboard.spotsLeft(spotsLeft)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-xl font-bold text-foreground leading-tight">
          {ride.title}
        </h3>

        {/* Pace */}
        {ride.pace_group && (
          <p className="mt-1.5 text-base text-muted-foreground">
            {ride.pace_group.name}
            {ride.is_drop_ride && (
              <span className="ml-1 text-destructive/70">· Drop</span>
            )}
          </p>
        )}

        {/* Details */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-muted-foreground">
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
          <span className="flex items-center gap-1.5">
            <Users weight="fill" className="h-4 w-4" />
            {ride.signup_count}{ride.capacity != null ? `/${ride.capacity}` : ""} riders
          </span>
        </div>

        {/* Capacity line */}
        {capacityPercent != null && (
          <div className="mt-5 h-0.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-primary">
          {dashboard.viewRide}
          <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
