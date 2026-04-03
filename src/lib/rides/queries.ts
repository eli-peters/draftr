import { cache } from 'react';
import { createClient, getUser } from '@/lib/supabase/server';
import { SignupStatus } from '@/config/statuses';
import { todayDateString, todayInTimezone } from '@/config/formatting';
import { isRideCompleted } from '@/lib/rides/lifecycle';
import type {
  Ride,
  PaceGroup,
  User,
  RideWithDetails,
  RideWeatherSnapshot,
  CommentWithUser,
  SignupAvatar,
  ReactionType,
  ReactionSummary,
} from '@/types/database';

// ---------------------------------------------------------------------------
// Shared join-result types — used by action-bar queries to avoid double-casts
// ---------------------------------------------------------------------------

/** Join shape for pace_group:pace_groups(name, sort_order) */
type JoinedPaceGroup = { name: string; sort_order: number } | null;

/** Join shape for ride_signups(status) — used to count active signups in JS. */
type JoinedSignupStatus = { status: string }[];

/** Count signups that are confirmed or checked-in. */
function countActiveSignups(signups: JoinedSignupStatus): number {
  return signups.filter(
    (s) => s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.CHECKED_IN,
  ).length;
}

/** Common ride row returned by action-bar queries with location/pace/weather joins. */
interface ActionBarRideRow {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  distance_km: number | null;
  start_location_name: string | null;
  pace_group: JoinedPaceGroup;
  ride_weather_snapshots: RideWeatherSnapshot | null;
}

/** Map a joined ride row to the flattened action-bar result shape. */
function toActionBarResult(row: ActionBarRideRow) {
  return {
    id: row.id,
    title: row.title,
    ride_date: row.ride_date,
    start_time: row.start_time,
    end_time: row.end_time,
    distance_km: row.distance_km,
    meeting_location_name: row.start_location_name ?? null,
    pace_group_name: row.pace_group?.name ?? null,
    pace_group_sort_order: row.pace_group?.sort_order ?? null,
    weather: row.ride_weather_snapshots ?? null,
  };
}

/** Shape returned by Supabase for the RIDE_WITH_DETAILS_SELECT join query. */
interface RawRideRow extends Ride {
  pace_group: PaceGroup | null;
  creator: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null;
  ride_signups:
    | {
        status: string;
        user_id: string;
        waitlist_position: number | null;
        signed_up_at: string;
        user: Pick<User, 'avatar_url' | 'full_name'>;
      }[]
    | null;
  ride_leaders:
    | {
        user_id: string;
        user: Pick<User, 'full_name' | 'avatar_url'>;
      }[]
    | null;
  ride_weather_snapshots: RideWeatherSnapshot | null;
}

/** Select string shared by queries that return RideWithDetails. */
const RIDE_WITH_DETAILS_SELECT = `
  *,
  pace_group:pace_groups(*),
  creator:users!rides_created_by_fkey(id, full_name, avatar_url),
  ride_signups(status, user_id, waitlist_position, signed_up_at, user:users!inner(avatar_url, full_name)),
  ride_leaders(user_id, user:users!ride_leaders_user_id_fkey(full_name, avatar_url)),
  ride_weather_snapshots(*)
`;

/** Map a raw Supabase ride row (with joins) into a RideWithDetails shape. */
function toRideWithDetails(ride: RawRideRow, currentUserId?: string): RideWithDetails {
  const signups = ride.ride_signups ?? [];
  const userSignup = currentUserId
    ? signups.find(
        (s) =>
          s.user_id === currentUserId &&
          (s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.WAITLISTED),
      )
    : undefined;

  // First 4 confirmed signups for avatar display, ordered by sign-up time
  const confirmedSignups = signups
    .filter((s) => s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.CHECKED_IN)
    .sort((a, b) => new Date(a.signed_up_at).getTime() - new Date(b.signed_up_at).getTime());

  const signupAvatars: SignupAvatar[] = confirmedSignups.slice(0, 4).map((s) => ({
    avatar_url: s.user.avatar_url,
    full_name: s.user.full_name,
  }));

  return {
    ...ride,
    signup_count: confirmedSignups.length,
    signup_avatars: signupAvatars,
    creator: ride.creator ?? null,
    current_user_signup_status: (userSignup?.status as 'confirmed' | 'waitlisted') ?? null,
    current_user_waitlist_position:
      userSignup?.status === SignupStatus.WAITLISTED
        ? signups
            .filter((s) => s.status === SignupStatus.WAITLISTED)
            .sort((a, b) => new Date(a.signed_up_at).getTime() - new Date(b.signed_up_at).getTime())
            .findIndex((s) => s.user_id === currentUserId) + 1 || null
        : null,
    co_leaders: (ride.ride_leaders ?? []).map((rl) => ({
      user_id: rl.user_id,
      full_name: rl.user.full_name,
      avatar_url: rl.user.avatar_url,
    })),
    // PostgREST returns object (not array) for 1-to-1 joins via UNIQUE constraint
    weather: ride.ride_weather_snapshots ?? null,
  };
}

/**
 * Fetch upcoming rides for a club, with joined relations.
 */
export async function getUpcomingRides(
  clubId: string,
  userId?: string,
  timezone?: string,
): Promise<RideWithDetails[]> {
  const supabase = await createClient();
  const today = timezone ? todayInTimezone(timezone) : todayDateString();

  const { data, error } = await supabase
    .from('rides')
    .select(RIDE_WITH_DETAILS_SELECT)
    .eq('club_id', clubId)
    .gte('ride_date', today)
    .order('ride_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error?.message) {
    console.error('Error fetching rides:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((ride) => toRideWithDetails(ride, userId));
}

/**
 * Fetch a single ride by ID with full details.
 */
export async function getRideById(rideId: string): Promise<RideWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('rides')
    .select(RIDE_WITH_DETAILS_SELECT)
    .eq('id', rideId)
    .single();

  if (error || !data) {
    return null;
  }

  return toRideWithDetails(data);
}

/**
 * Check if the current user is signed up for a ride.
 */
export async function getUserSignupStatus(rideId: string) {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  const { data } = await supabase
    .from('ride_signups')
    .select('id, status, signed_up_at')
    .eq('ride_id', rideId)
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .maybeSingle();

  if (!data) return null;

  // Derive waitlist position from signed_up_at order
  let waitlist_position: number | null = null;
  if (data.status === 'waitlisted' && data.signed_up_at) {
    const { count } = await supabase
      .from('ride_signups')
      .select('*', { count: 'exact', head: true })
      .eq('ride_id', rideId)
      .eq('status', 'waitlisted')
      .lte('signed_up_at', data.signed_up_at);
    waitlist_position = count ?? null;
  }

  return { id: data.id, status: data.status, waitlist_position };
}

/**
 * Fetch the user's next confirmed ride signup (for action bar).
 */
export async function getUserNextSignup(userId: string, clubId: string, timezone: string) {
  const supabase = await createClient();
  const today = todayInTimezone(timezone);

  // Fetch a small batch so we can skip completed same-day rides
  const { data } = await supabase
    .from('ride_signups')
    .select(
      `
      id, status,
      ride:rides!inner(
        id, title, ride_date, start_time, end_time, status, capacity, distance_km, elevation_m,
        start_location_name,
        pace_group:pace_groups(name, sort_order),
        ride_signups(status),
        ride_weather_snapshots(*)
      )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .eq('ride.club_id', clubId)
    .gte('ride.ride_date', today)
    .neq('ride.status', 'cancelled')
    .order('ride(ride_date)', { ascending: true })
    .limit(5);

  if (!data?.length) return null;

  type RideRow = {
    id: string;
    title: string;
    ride_date: string;
    start_time: string;
    end_time: string | null;
    capacity: number | null;
    distance_km: number | null;
    elevation_m: number | null;
    start_location_name: string | null;
    pace_group: { name: string; sort_order: number } | null;
    ride_signups: JoinedSignupStatus;
    ride_weather_snapshots: RideWeatherSnapshot | null;
  };

  for (const row of data) {
    if (!row.ride) continue;
    const ride = row.ride as unknown as RideRow;
    if (isRideCompleted(ride.ride_date, ride.start_time, ride.end_time, timezone)) continue;

    return {
      id: ride.id,
      title: ride.title,
      ride_date: ride.ride_date,
      start_time: ride.start_time,
      end_time: ride.end_time,
      meeting_location_name: ride.start_location_name ?? null,
      pace_group_name: ride.pace_group?.name ?? null,
      pace_group_sort_order: ride.pace_group?.sort_order ?? null,
      distance_km: ride.distance_km,
      elevation_m: ride.elevation_m,
      signup_count: countActiveSignups(ride.ride_signups ?? []),
      capacity: ride.capacity,
      weather: ride.ride_weather_snapshots ?? null,
    };
  }

  return null;
}

/**
 * Fetch the leader's next upcoming led ride (for action bar).
 */
export async function getLeaderNextLedRide(userId: string, clubId: string, timezone: string) {
  const supabase = await createClient();
  const today = todayInTimezone(timezone);

  // Fetch a small batch so we can skip completed same-day rides
  const { data } = await supabase
    .from('rides')
    .select(
      `
      id, title, ride_date, start_time, end_time, capacity, distance_km, elevation_m,
      start_location_name,
      pace_group:pace_groups(name, sort_order),
      ride_signups(status),
      ride_weather_snapshots(*)
    `,
    )
    .eq('club_id', clubId)
    .eq('created_by', userId)
    .gte('ride_date', today)
    .neq('status', 'cancelled')
    .order('ride_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(5);

  if (!data?.length) return null;

  type LedRideRow = ActionBarRideRow & {
    elevation_m: number | null;
    capacity: number | null;
    ride_signups: JoinedSignupStatus;
  };

  for (const row of data as unknown as LedRideRow[]) {
    if (isRideCompleted(row.ride_date, row.start_time, row.end_time, timezone)) continue;

    return {
      ...toActionBarResult(row),
      elevation_m: row.elevation_m,
      signup_count: countActiveSignups(row.ride_signups ?? []),
      capacity: row.capacity,
    };
  }

  return null;
}

/**
 * Fetch the user's next waitlisted ride (for action bar).
 */
export async function getUserNextWaitlistedRide(userId: string, clubId: string, timezone: string) {
  const supabase = await createClient();
  const today = todayInTimezone(timezone);

  // Fetch a small batch so we can skip completed same-day rides
  const { data } = await supabase
    .from('ride_signups')
    .select(
      `
      id, status, signed_up_at,
      ride:rides!inner(
        id, title, ride_date, start_time, end_time, status,
        distance_km, elevation_m,
        start_location_name,
        pace_group:pace_groups(name, sort_order)
      )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'waitlisted')
    .eq('ride.club_id', clubId)
    .gte('ride.ride_date', today)
    .neq('ride.status', 'cancelled')
    .order('ride(ride_date)', { ascending: true })
    .limit(5);

  if (!data?.length) return null;

  type RideRow = {
    id: string;
    title: string;
    ride_date: string;
    start_time: string;
    end_time: string | null;
    distance_km: number | null;
    elevation_m: number | null;
    start_location_name: string | null;
    pace_group: { name: string; sort_order: number } | null;
  };

  for (const row of data) {
    if (!row.ride) continue;
    const ride = row.ride as unknown as RideRow;
    if (isRideCompleted(ride.ride_date, ride.start_time, ride.end_time, timezone)) continue;

    // Derive waitlist position from signed_up_at order
    const { count } = await supabase
      .from('ride_signups')
      .select('*', { count: 'exact', head: true })
      .eq('ride_id', ride.id)
      .eq('status', 'waitlisted')
      .lte('signed_up_at', row.signed_up_at);

    return {
      id: ride.id,
      title: ride.title,
      ride_date: ride.ride_date,
      start_time: ride.start_time,
      end_time: ride.end_time,
      distance_km: ride.distance_km,
      elevation_m: ride.elevation_m,
      meeting_location_name: ride.start_location_name ?? null,
      pace_group_name: ride.pace_group?.name ?? null,
      pace_group_sort_order: ride.pace_group?.sort_order ?? null,
      waitlist_position: count ?? 1,
    };
  }

  return null;
}

/**
 * Count rides this week without a leader (created_by IS NULL).
 */
export async function getRidesNeedingLeaderCount(clubId: string, timezone?: string) {
  const supabase = await createClient();
  const todayStr = timezone ? todayInTimezone(timezone) : new Date().toISOString().split('T')[0];
  const weekFromNow = new Date(todayStr + 'T00:00:00');
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekStr = weekFromNow.toISOString().split('T')[0];

  const { count } = await supabase
    .from('rides')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .is('created_by', null)
    .gte('ride_date', todayStr)
    .lte('ride_date', weekStr)
    .neq('status', 'cancelled');

  return count ?? 0;
}

/**
 * Get the leader's next led ride that's in weather_watch status (for action bar stub).
 */
export async function getLeaderWeatherWatchRide(userId: string, clubId: string, timezone: string) {
  const supabase = await createClient();
  const today = todayInTimezone(timezone);

  // Fetch a small batch so we can skip completed same-day rides
  const { data } = await supabase
    .from('rides')
    .select(
      `
      id, title, ride_date, start_time, end_time, distance_km,
      start_location_name,
      pace_group:pace_groups(name, sort_order),
      ride_weather_snapshots(*)
    `,
    )
    .eq('club_id', clubId)
    .eq('created_by', userId)
    .eq('status', 'weather_watch')
    .gte('ride_date', today)
    .order('ride_date', { ascending: true })
    .limit(5);

  if (!data?.length) return null;

  for (const row of data as unknown as ActionBarRideRow[]) {
    if (isRideCompleted(row.ride_date, row.start_time, row.end_time, timezone)) continue;
    return toActionBarResult(row);
  }

  return null;
}

/**
 * Fetch the single next upcoming non-cancelled ride for a club.
 * Lightweight query for the homepage nudge — minimal fields, no joins beyond pace group.
 */
export async function getNextAvailableRide(
  clubId: string,
  timezone: string,
  excludeIds: string[] = [],
) {
  const supabase = await createClient();
  const today = todayInTimezone(timezone);

  // Fetch a small batch so we can skip completed same-day rides + user's personal rides
  const { data } = await supabase
    .from('rides')
    .select(
      `
      id, title, ride_date, start_time, end_time, distance_km,
      start_location_name,
      pace_group:pace_groups(name, sort_order),
      ride_weather_snapshots(*)
    `,
    )
    .eq('club_id', clubId)
    .gte('ride_date', today)
    .neq('status', 'cancelled')
    .order('ride_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(5);

  if (!data?.length) return null;

  const skipIds = new Set(excludeIds);
  for (const row of data as unknown as ActionBarRideRow[]) {
    if (isRideCompleted(row.ride_date, row.start_time, row.end_time, timezone)) continue;
    if (skipIds.has(row.id)) continue;
    return toActionBarResult(row);
  }

  return null;
}

/**
 * Get the user's club membership (first active club).
 * Wrapped in React.cache() — called by layout + every child page, deduplicates per request.
 */
export const getUserClubMembership = cache(async () => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('club_memberships')
    .select('*, club:clubs(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!data) return null;

  return { ...data, user_id: user.id };
});

/**
 * Fetch pace groups for a club (for ride creation form).
 */
export async function getPaceGroups(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pace_groups')
    .select('id, name, sort_order')
    .eq('club_id', clubId)
    .order('sort_order');
  return data ?? [];
}

/**
 * Fetch rides created by a leader (or all rides for admin) in a club.
 */
export async function getLeaderRides(userId: string, clubId: string, isAdmin: boolean) {
  const supabase = await createClient();

  let query = supabase
    .from('rides')
    .select(
      `
      id, title, ride_date, start_time, status, capacity, template_id, distance_km,
      start_location_name,
      pace_group:pace_groups(id, name, sort_order),
      creator:users!rides_created_by_fkey(full_name),
      ride_signups(status)
    `,
    )
    .eq('club_id', clubId)
    .order('ride_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (!isAdmin) {
    query = query.eq('created_by', userId);
  }

  const { data, error } = await query;

  if (error?.message) {
    console.error('Error fetching leader rides:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((ride) => {
    const pace = ride.pace_group as unknown as {
      id: string;
      name: string;
      sort_order: number;
    } | null;
    const signups = ride.ride_signups as unknown as JoinedSignupStatus;
    const creator = ride.creator as unknown as {
      full_name: string;
    } | null;
    return {
      id: ride.id,
      title: ride.title,
      ride_date: ride.ride_date,
      start_time: ride.start_time,
      status: ride.status,
      capacity: ride.capacity as number | null,
      distance_km: (ride as Record<string, unknown>).distance_km as number | null,
      template_id: (ride as Record<string, unknown>).template_id as string | null,
      meeting_location_name:
        ((ride as Record<string, unknown>).start_location_name as string) ?? null,
      pace_group_id: pace?.id ?? null,
      pace_group_name: pace?.name ?? null,
      pace_group_sort_order: pace?.sort_order ?? null,
      signup_count: countActiveSignups(signups ?? []),
      created_by_name: creator?.full_name ?? null,
    };
  });
}

/**
 * Fetch signups for a ride (for the signup roster).
 */
export async function getRideSignups(rideId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ride_signups')
    .select(
      `
      id, status, signed_up_at, waitlist_position,
      user:users!inner(id, full_name, avatar_url)
    `,
    )
    .eq('ride_id', rideId)
    .neq('status', 'cancelled')
    .order('signed_up_at', { ascending: true });

  if (error?.message) {
    console.error('Error fetching ride signups:', error.message, error.code, error.details);
    return [];
  }

  // Derive waitlist positions from signed_up_at order (already sorted ascending)
  let waitlistIndex = 0;
  return (data ?? []).map((signup) => {
    const user = signup.user as unknown as {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    const isWaitlisted = signup.status === 'waitlisted';
    return {
      id: signup.id,
      status: signup.status,
      signed_up_at: signup.signed_up_at,
      waitlist_position: isWaitlisted ? ++waitlistIndex : null,
      user_id: user.id,
      user_name: user.full_name,
      avatar_url: user.avatar_url,
    };
  });
}

export type UserRideSignup = {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  pace_group_name: string | null;
  meeting_location_name: string | null;
  meeting_location_address: string | null;
  meeting_location_latitude: number | null;
  meeting_location_longitude: number | null;
  distance_km: number | null;
  elevation_m: number | null;
  end_time: string | null;
  signup_count: number;
  capacity: number | null;
  signed_up_at: string | null;
  waitlist_position: number | null;
  signup_status: 'confirmed' | 'waitlisted' | 'checked_in' | 'completed' | 'cancelled';
  pace_group_sort_order: number | null;
  weather: RideWeatherSnapshot | null;
};

/**
 * Fetch the user's ride signups, filtered by tab (upcoming, past, waitlisted).
 */
export async function getUserRideSignups(
  userId: string,
  clubId: string,
  filter: 'upcoming' | 'past' | 'waitlisted',
): Promise<UserRideSignup[]> {
  const supabase = await createClient();
  const today = todayDateString();

  let query = supabase
    .from('ride_signups')
    .select(
      `
      id, status, signed_up_at, waitlist_position,
      ride:rides!inner(
        id, title, ride_date, start_time, end_time, distance_km, elevation_m, capacity,
        start_location_name, start_location_address, start_latitude, start_longitude,
        pace_group:pace_groups(name, sort_order),
        ride_signups(status),
        ride_weather_snapshots(*)
      )
    `,
    )
    .eq('user_id', userId)
    .eq('ride.club_id', clubId);

  switch (filter) {
    case 'upcoming':
      query = query.in('status', ['confirmed', 'cancelled']).gte('ride.ride_date', today);
      break;
    case 'past':
      query = query
        .in('status', ['confirmed', 'checked_in', 'cancelled'])
        .lt('ride.ride_date', today);
      break;
    case 'waitlisted':
      query = query.eq('status', 'waitlisted').gte('ride.ride_date', today);
      break;
  }

  const { data, error } = await query.order('ride(ride_date)', {
    ascending: filter !== 'past',
  });

  if (error?.message) {
    console.error('Error fetching user ride signups:', error.message, error.code, error.details);
    return [];
  }

  // Derive waitlist positions from signed_up_at order per ride
  const positionMap = new Map<string, number>();
  if (filter === 'waitlisted' && data && data.length > 0) {
    const rideIds = data.map((s) => (s.ride as unknown as { id: string }).id);
    const { data: allWaitlisted } = await supabase
      .from('ride_signups')
      .select('ride_id, user_id, signed_up_at')
      .in('ride_id', rideIds)
      .eq('status', 'waitlisted')
      .order('signed_up_at', { ascending: true });

    if (allWaitlisted) {
      const byRide = new Map<string, number>();
      for (const entry of allWaitlisted) {
        const pos = (byRide.get(entry.ride_id) ?? 0) + 1;
        byRide.set(entry.ride_id, pos);
        if (entry.user_id === userId) {
          positionMap.set(entry.ride_id, pos);
        }
      }
    }
  }

  return (data ?? []).map((signup) => {
    const ride = signup.ride as unknown as {
      id: string;
      title: string;
      ride_date: string;
      start_time: string;
      end_time: string | null;
      distance_km: number | null;
      elevation_m: number | null;
      capacity: number | null;
      start_location_name: string | null;
      start_location_address: string | null;
      start_latitude: number | null;
      start_longitude: number | null;
      pace_group: { name: string; sort_order: number } | null;
      ride_signups: JoinedSignupStatus;
      ride_weather_snapshots: RideWeatherSnapshot | null;
    };

    return {
      id: ride.id,
      title: ride.title,
      ride_date: ride.ride_date,
      start_time: ride.start_time,
      end_time: ride.end_time ?? null,
      pace_group_name: ride.pace_group?.name ?? null,
      pace_group_sort_order: ride.pace_group?.sort_order ?? null,
      meeting_location_name: ride.start_location_name ?? null,
      meeting_location_address: ride.start_location_address ?? null,
      meeting_location_latitude: ride.start_latitude ?? null,
      meeting_location_longitude: ride.start_longitude ?? null,
      distance_km: ride.distance_km,
      elevation_m: ride.elevation_m ?? null,
      signup_count: countActiveSignups(ride.ride_signups ?? []),
      capacity: ride.capacity,
      signed_up_at: signup.signed_up_at,
      waitlist_position: positionMap.get(ride.id) ?? signup.waitlist_position,
      signup_status:
        signup.status === 'cancelled'
          ? 'cancelled'
          : filter === 'past'
            ? 'completed'
            : (signup.status as UserRideSignup['signup_status']),
      weather: ride.ride_weather_snapshots ?? null,
    };
  });
}

/**
 * Fetch comments for a ride with user info, ordered oldest first.
 */
export async function getRideComments(rideId: string): Promise<CommentWithUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ride_comments')
    .select(
      `
      id, ride_id, user_id, body, created_at, updated_at,
      user:users!inner(full_name, avatar_url)
    `,
    )
    .eq('ride_id', rideId)
    .order('created_at', { ascending: true });

  if (error?.message) {
    console.error('Error fetching ride comments:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((comment) => {
    const user = comment.user as unknown as {
      full_name: string;
      avatar_url: string | null;
    };
    return {
      id: comment.id,
      ride_id: comment.ride_id,
      user_id: comment.user_id,
      body: comment.body,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user_name: user.full_name,
      avatar_url: user.avatar_url,
    };
  });
}

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

/**
 * Fetch reaction summaries for a ride, grouped by reaction type.
 */
export async function getRideReactions(rideId: string): Promise<ReactionSummary[]> {
  const supabase = await createClient();
  const user = await getUser();
  const currentUserId = user?.id ?? null;

  const { data, error } = await supabase
    .from('ride_reactions')
    .select('reaction, user_id, user:users!inner(full_name)')
    .eq('ride_id', rideId);

  if (error?.message) {
    console.error('Error fetching ride reactions:', error.message);
    return [];
  }

  return aggregateReactions(data ?? [], currentUserId);
}

/**
 * Batch-fetch reaction summaries for multiple comments.
 * Returns a Map keyed by comment_id.
 */
export async function getCommentReactions(
  commentIds: string[],
): Promise<Map<string, ReactionSummary[]>> {
  const result = new Map<string, ReactionSummary[]>();
  if (commentIds.length === 0) return result;

  const supabase = await createClient();
  const user = await getUser();
  const currentUserId = user?.id ?? null;

  const { data, error } = await supabase
    .from('comment_reactions')
    .select('comment_id, reaction, user_id, user:users!inner(full_name)')
    .in('comment_id', commentIds);

  if (error?.message) {
    console.error('Error fetching comment reactions:', error.message);
    return result;
  }

  // Group by comment_id first, then aggregate each group
  const rows = data ?? [];
  const byComment = new Map<string, typeof rows>();
  for (const row of rows) {
    const existing = byComment.get(row.comment_id) ?? [];
    existing.push(row);
    byComment.set(row.comment_id, existing);
  }

  for (const [commentId, rows] of byComment) {
    result.set(commentId, aggregateReactions(rows, currentUserId));
  }

  return result;
}

/**
 * Aggregate raw reaction rows into ReactionSummary array.
 */
function aggregateReactions(
  rows: Array<{
    reaction: string;
    user_id: string;
    user: unknown;
  }>,
  currentUserId: string | null,
): ReactionSummary[] {
  const map = new Map<ReactionType, { count: number; userNames: string[]; hasReacted: boolean }>();

  for (const row of rows) {
    const reaction = row.reaction as ReactionType;
    const userName = (row.user as { full_name: string }).full_name;
    const existing = map.get(reaction) ?? { count: 0, userNames: [], hasReacted: false };
    existing.count++;
    existing.userNames.push(userName);
    if (row.user_id === currentUserId) existing.hasReacted = true;
    map.set(reaction, existing);
  }

  return Array.from(map.entries()).map(([reaction, data]) => ({
    reaction,
    ...data,
  }));
}

// ---------------------------------------------------------------------------
// Co-Leaders
// ---------------------------------------------------------------------------

export interface RideLeader {
  user_id: string;
  name: string;
  added_at: string;
}

/**
 * Fetch co-leaders for a ride (not including the ride creator).
 */
export async function getRideCoLeaders(rideId: string): Promise<RideLeader[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ride_leaders')
    .select('user_id, added_at, user:users!ride_leaders_user_id_fkey(full_name)')
    .eq('ride_id', rideId)
    .order('added_at', { ascending: true });

  if (error?.message) {
    console.error('Error fetching ride co-leaders:', error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const user = row.user as unknown as { full_name: string };
    return {
      user_id: row.user_id,
      name: user?.full_name ?? '',
      added_at: row.added_at,
    };
  });
}
