import { TZDate } from '@date-fns/tz';
import { RideStatus } from '@/config/statuses';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minutes before ride start_time when self-service signup/cancel closes. */
export const SIGNUP_CUTOFF_MINUTES = 10;

/** Fallback ride duration (hours) when no end_time is set. */
const DEFAULT_DURATION_HOURS = 3;

// ---------------------------------------------------------------------------
// Computed lifecycle — derived from ride_date + times vs. now
// ---------------------------------------------------------------------------

export type RideLifecycle = 'upcoming' | 'about_to_start' | 'in_progress' | 'completed';

/**
 * Derive the temporal lifecycle state of a ride from its schedule.
 *
 * - `upcoming`        → now is before the signup cutoff
 * - `about_to_start`  → now is within SIGNUP_CUTOFF_MINUTES of start
 * - `in_progress`     → now is between start and end (or start + fallback)
 * - `completed`       → now is after end (or start + fallback)
 */
export function getRideLifecycle(
  rideDate: string,
  startTime: string,
  endTime: string | null,
  timezone: string,
): RideLifecycle {
  const now = new Date();

  // Combine date + time → timezone-aware DateTime
  const startDateTime = combineDateAndTime(rideDate, startTime, timezone);
  const cutoffDateTime = new Date(startDateTime.getTime() - SIGNUP_CUTOFF_MINUTES * 60_000);

  // End time: use explicit end_time or fallback to start + DEFAULT_DURATION_HOURS
  const endDateTime = endTime
    ? combineDateAndTime(rideDate, endTime, timezone)
    : new Date(startDateTime.getTime() + DEFAULT_DURATION_HOURS * 3_600_000);

  if (now < cutoffDateTime) return 'upcoming';
  if (now < startDateTime) return 'about_to_start';
  if (now < endDateTime) return 'in_progress';
  return 'completed';
}

// ---------------------------------------------------------------------------
// Ride availability — combines lifecycle + DB status for action gating
// ---------------------------------------------------------------------------

interface RideTimingFields {
  ride_date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  capacity: number | null;
}

export interface RideAvailability {
  lifecycle: RideLifecycle;
  isCancelled: boolean;
  canSignUp: boolean;
  canCancel: boolean;
  isFull: boolean;
  /** True when ride is in_progress or completed (backward-compat helper). */
  isPast: boolean;
}

/**
 * Compute the full availability state for a ride.
 * Used by both UI components and server actions to make consistent decisions.
 */
export function getRideAvailability(
  ride: RideTimingFields,
  confirmedCount: number,
  timezone: string,
): RideAvailability {
  const lifecycle = getRideLifecycle(ride.ride_date, ride.start_time, ride.end_time, timezone);
  const isCancelled = ride.status === RideStatus.CANCELLED;
  const isFull = ride.capacity != null && confirmedCount >= ride.capacity;

  // Self-service actions are only available during the "upcoming" window
  const canSignUp = lifecycle === 'upcoming' && !isCancelled;
  const canCancel = lifecycle === 'upcoming' && !isCancelled;
  const isPast = lifecycle === 'in_progress' || lifecycle === 'completed';

  return { lifecycle, isCancelled, canSignUp, canCancel, isFull, isPast };
}

/**
 * Quick boolean check — has this ride passed its end time?
 * Used by query helpers to filter out completed rides before returning results.
 */
export function isRideCompleted(
  rideDate: string,
  startTime: string,
  endTime: string | null,
  timezone: string,
): boolean {
  return getRideLifecycle(rideDate, startTime, endTime, timezone) === 'completed';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Combine an ISO date string ("2026-03-25") with a time string ("09:00" or "09:00:00")
 * into a local Date object. Uses parseISO for correct local timezone handling.
 */
function combineDateAndTime(dateStr: string, timeStr: string, timezone: string): Date {
  // Ensure time has seconds
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new TZDate(`${dateStr}T${normalizedTime}`, timezone);
}
