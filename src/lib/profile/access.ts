import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/config/navigation';

/**
 * ProfileViewerAccess — single source of truth for what a viewer can see
 * on a profile page. Resolved server-side and passed to the shared
 * <ProfilePage> component, which gates visibility purely on these booleans.
 */
export interface ProfileViewerAccess {
  /** Self-view — controls the single Edit affordance on the page. */
  canEdit: boolean;
  /** Phone number visibility. Admins always; leaders for any active member. */
  canSeeContact: boolean;
  /** Email visibility. Admins only (beyond self). */
  canSeeEmail: boolean;
  /** Emergency contact visibility. Self/admin always; leaders only inside window. */
  canSeeEmergency: boolean;
  /** True when emergency is visible *because of* the leader time window. */
  emergencyViaLeaderWindow: boolean;
}

/**
 * Resolve viewer access for a profile page. The `now` parameter is injected
 * so tests can pin time; callers in production should pass `new Date()`.
 */
export async function getProfileViewerAccess({
  viewerId,
  viewerRole,
  subjectId,
  now,
}: {
  viewerId: string;
  viewerRole: UserRole;
  subjectId: string;
  now: Date;
}): Promise<ProfileViewerAccess> {
  // Self-view — full access.
  if (viewerId === subjectId) {
    return {
      canEdit: true,
      canSeeContact: true,
      canSeeEmail: true,
      canSeeEmergency: true,
      emergencyViaLeaderWindow: false,
    };
  }

  // Admin — full visibility, no edit (admins edit via /manage, not /profile).
  if (viewerRole === 'admin') {
    return {
      canEdit: false,
      canSeeContact: true,
      canSeeEmail: true,
      canSeeEmergency: true,
      emergencyViaLeaderWindow: false,
    };
  }

  // Ride leader — can always see contact info for reaching riders.
  // Emergency contact is gated on the 12h-before / 12h-after leader window.
  if (viewerRole === 'ride_leader') {
    const emergencyViaLeaderWindow = await leaderHasActiveWindow({
      leaderId: viewerId,
      riderId: subjectId,
      now,
    });
    return {
      canEdit: false,
      canSeeContact: true,
      canSeeEmail: false,
      canSeeEmergency: emergencyViaLeaderWindow,
      emergencyViaLeaderWindow,
    };
  }

  // Rider — basic visibility only. No contact, no emergency, no email.
  return {
    canEdit: false,
    canSeeContact: false,
    canSeeEmail: false,
    canSeeEmergency: false,
    emergencyViaLeaderWindow: false,
  };
}

const WINDOW_HOURS_BEFORE = 12;
const WINDOW_HOURS_AFTER = 12;
const MS_PER_HOUR = 3_600_000;

interface RideWindowRow {
  ride: {
    ride_date: string;
    start_time: string;
    end_time: string | null;
  };
}

/**
 * Is the viewer currently leading a ride that the subject is signed up for,
 * within the 12h-before / 12h-after window?
 *
 * "Leading" means one of:
 *   - viewer is the ride creator (rides.created_by)
 *   - viewer is in ride_leaders for that ride
 *
 * "Subject is on the ride" means an active signup (confirmed/checked_in).
 *
 * The window is computed per-ride:
 *   windowStart = ride_start - 12h
 *   windowEnd   = ride_end   + 12h   (falls back to ride_start + 3h if null)
 */
async function leaderHasActiveWindow({
  leaderId,
  riderId,
  now,
}: {
  leaderId: string;
  riderId: string;
  now: Date;
}): Promise<boolean> {
  const supabase = await createClient();
  const nowMs = now.getTime();

  // Pull all rides the rider is signed up for within a +/- 2 day window of now.
  // This is a cheap prefilter — the exact window comparison happens in JS below
  // because start_time/end_time are TIME columns and need to be combined with
  // ride_date to get a full timestamp.
  const PREFILTER_MS = 2 * 24 * MS_PER_HOUR;
  const todayIso = toIsoDate(new Date(nowMs - PREFILTER_MS));
  const horizonIso = toIsoDate(new Date(nowMs + PREFILTER_MS));

  const { data: signups, error: signupErr } = await supabase
    .from('ride_signups')
    .select(
      `
      ride:rides!inner(ride_date, start_time, end_time, id, created_by)
    `,
    )
    .eq('user_id', riderId)
    .in('status', ['confirmed', 'checked_in'])
    .gte('ride.ride_date', todayIso)
    .lte('ride.ride_date', horizonIso);

  if (signupErr?.message) {
    console.error('[profile/access] Error fetching rider signups:', signupErr.message);
    return false;
  }

  if (!signups || signups.length === 0) return false;

  const candidateRides = (
    signups as unknown as (RideWindowRow & { ride: { id: string; created_by: string } })[]
  )
    .map((row) => row.ride)
    .filter((ride) => isWithinLeaderWindow(ride, now));

  if (candidateRides.length === 0) return false;

  // Filter to rides the viewer actually leads — creator OR co-leader.
  const rideIds = candidateRides.map((r) => r.id);

  const createdByViewer = candidateRides.some((r) => r.created_by === leaderId);
  if (createdByViewer) return true;

  const { data: coLeaderRows, error: coLeaderErr } = await supabase
    .from('ride_leaders')
    .select('ride_id')
    .eq('user_id', leaderId)
    .in('ride_id', rideIds);

  if (coLeaderErr?.message) {
    console.error('[profile/access] Error fetching co-leaders:', coLeaderErr.message);
    return false;
  }

  return (coLeaderRows?.length ?? 0) > 0;
}

/**
 * Is `now` within [ride_start - 12h, ride_end + 12h]?
 * ride_end falls back to ride_start + 3h when null.
 */
function isWithinLeaderWindow(
  ride: { ride_date: string; start_time: string; end_time: string | null },
  now: Date,
): boolean {
  const start = combineDateAndTime(ride.ride_date, ride.start_time);
  const end = ride.end_time
    ? combineDateAndTime(ride.ride_date, ride.end_time)
    : new Date(start.getTime() + 3 * MS_PER_HOUR);

  const windowStart = start.getTime() - WINDOW_HOURS_BEFORE * MS_PER_HOUR;
  const windowEnd = end.getTime() + WINDOW_HOURS_AFTER * MS_PER_HOUR;

  const nowMs = now.getTime();
  return nowMs >= windowStart && nowMs <= windowEnd;
}

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  // ride_date is a DATE ('YYYY-MM-DD'), start_time/end_time are TIME ('HH:MM:SS').
  // Interpret as local time — consistent with how the rest of the app treats
  // scheduled ride times (see parseLocalDate in src/config/formatting.ts).
  return new Date(`${dateStr}T${timeStr}`);
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}
