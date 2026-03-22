import { createClient } from '@/lib/supabase/server';
import { SignupStatus } from '@/config/statuses';
import { todayDateString } from '@/config/formatting';
import type {
  RideWithDetails,
  RideWeatherSnapshot,
  CommentWithUser,
  RidePickupWithLocation,
} from '@/types/database';

/** Select string shared by queries that return RideWithDetails. */
const RIDE_WITH_DETAILS_SELECT = `
  *,
  meeting_location:meeting_locations(*),
  pace_group:pace_groups(*),
  ride_tags(tag:tags(*)),
  creator:users!rides_created_by_fkey(id, full_name, display_name, avatar_url),
  ride_signups(status, user_id),
  ride_weather_snapshots(*)
`;

/** Map a raw Supabase ride row (with joins) into a RideWithDetails shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRideWithDetails(ride: any, currentUserId?: string): RideWithDetails {
  const signups = (ride.ride_signups ?? []) as { status: string; user_id: string }[];
  const userSignup = currentUserId
    ? signups.find(
        (s) =>
          s.user_id === currentUserId &&
          (s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.WAITLISTED),
      )
    : undefined;

  return {
    ...ride,
    tags: ride.ride_tags?.map((rt: { tag: unknown }) => rt.tag).filter(Boolean) ?? [],
    signup_count: signups.filter(
      (s) => s.status === SignupStatus.CONFIRMED || s.status === SignupStatus.CHECKED_IN,
    ).length,
    creator: ride.creator ?? null,
    current_user_signup_status: (userSignup?.status as 'confirmed' | 'waitlisted') ?? null,
    // PostgREST returns object (not array) for 1-to-1 joins via UNIQUE constraint
    weather: ride.ride_weather_snapshots ?? null,
  } as RideWithDetails;
}

/**
 * Fetch upcoming rides for a club, with joined relations.
 */
export async function getUpcomingRides(
  clubId: string,
  userId?: string,
): Promise<RideWithDetails[]> {
  const supabase = await createClient();
  const today = todayDateString();

  const { data, error } = await supabase
    .from('rides')
    .select(RIDE_WITH_DETAILS_SELECT)
    .eq('club_id', clubId)
    .gte('ride_date', today)
    .neq('status', 'cancelled')
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('ride_signups')
    .select('id, status')
    .eq('ride_id', rideId)
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .maybeSingle();

  return data;
}

/**
 * Fetch the user's next confirmed ride signup (for action bar).
 */
export async function getUserNextSignup(userId: string, clubId: string) {
  const supabase = await createClient();
  const today = todayDateString();

  const { data } = await supabase
    .from('ride_signups')
    .select(
      `
      id, status,
      ride:rides!inner(
        id, title, ride_date, start_time, status, capacity,
        meeting_location:meeting_locations(name),
        pace_group:pace_groups(name),
        ride_signups(count)
      )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .eq('ride.club_id', clubId)
    .gte('ride.ride_date', today)
    .neq('ride.status', 'cancelled')
    .order('ride(ride_date)', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.ride) return null;

  // Supabase returns the inner-joined ride as an object (not array) due to !inner
  const ride = data.ride as unknown as {
    id: string;
    title: string;
    ride_date: string;
    start_time: string;
    capacity: number | null;
    meeting_location: { name: string } | null;
    pace_group: { name: string } | null;
    ride_signups: { count: number }[];
  };

  return {
    id: ride.id,
    title: ride.title,
    ride_date: ride.ride_date,
    start_time: ride.start_time,
    meeting_location_name: ride.meeting_location?.name ?? null,
    pace_group_name: ride.pace_group?.name ?? null,
    signup_count: ride.ride_signups?.[0]?.count ?? 0,
    capacity: ride.capacity,
  };
}

/**
 * Fetch the leader's next upcoming led ride (for action bar).
 */
export async function getLeaderNextLedRide(userId: string, clubId: string) {
  const supabase = await createClient();
  const today = todayDateString();

  const { data } = await supabase
    .from('rides')
    .select(
      `
      id, title, ride_date, start_time, capacity,
      meeting_location:meeting_locations(name),
      ride_signups(count)
    `,
    )
    .eq('club_id', clubId)
    .eq('created_by', userId)
    .gte('ride_date', today)
    .neq('status', 'cancelled')
    .order('ride_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const location = data.meeting_location as unknown as { name: string } | null;
  const signups = data.ride_signups as unknown as { count: number }[];

  return {
    id: data.id,
    title: data.title,
    ride_date: data.ride_date,
    start_time: data.start_time,
    meeting_location_name: location?.name ?? null,
    signup_count: signups?.[0]?.count ?? 0,
    capacity: data.capacity as number | null,
  };
}

/**
 * Fetch the user's next waitlisted ride (for action bar).
 */
export async function getUserNextWaitlistedRide(userId: string, clubId: string) {
  const supabase = await createClient();
  const today = todayDateString();

  const { data } = await supabase
    .from('ride_signups')
    .select(
      `
      id, status, waitlist_position,
      ride:rides!inner(
        id, title, ride_date, start_time, status,
        meeting_location:meeting_locations(name)
      )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'waitlisted')
    .eq('ride.club_id', clubId)
    .gte('ride.ride_date', today)
    .neq('ride.status', 'cancelled')
    .order('ride(ride_date)', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.ride) return null;

  const ride = data.ride as unknown as {
    id: string;
    title: string;
    ride_date: string;
    start_time: string;
    meeting_location: { name: string } | null;
  };

  return {
    id: ride.id,
    title: ride.title,
    ride_date: ride.ride_date,
    start_time: ride.start_time,
    meeting_location_name: ride.meeting_location?.name ?? null,
    waitlist_position: data.waitlist_position as number,
  };
}

/**
 * Count rides this week without a leader (created_by IS NULL).
 */
export async function getRidesNeedingLeaderCount(clubId: string) {
  const supabase = await createClient();
  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const todayStr = today.toISOString().split('T')[0];
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
export async function getLeaderWeatherWatchRide(userId: string, clubId: string) {
  const supabase = await createClient();
  const today = todayDateString();

  const { data } = await supabase
    .from('rides')
    .select(
      `
      id, title, ride_date, start_time
    `,
    )
    .eq('club_id', clubId)
    .eq('created_by', userId)
    .eq('status', 'weather_watch')
    .gte('ride_date', today)
    .order('ride_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}

/**
 * Get the user's club membership (first active club).
 */
export async function getUserClubMembership() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('club_memberships')
    .select('*, club:clubs(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!data) return null;

  return { ...data, user_id: user.id };
}

/**
 * Fetch meeting locations for a club (for ride creation form).
 */
export async function getMeetingLocations(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('meeting_locations')
    .select('id, name')
    .eq('club_id', clubId)
    .eq('is_active', true)
    .order('name');
  return data ?? [];
}

/**
 * Fetch pace groups for a club (for ride creation form).
 */
export async function getPaceGroups(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pace_groups')
    .select('id, name')
    .eq('club_id', clubId)
    .order('sort_order');
  return data ?? [];
}

/**
 * Fetch tags for a club (for ride creation form).
 */
export async function getClubTags(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tags')
    .select('id, name, color')
    .eq('club_id', clubId)
    .order('name');
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
      meeting_location:meeting_locations(name),
      pace_group:pace_groups(id, name),
      creator:users!rides_created_by_fkey(full_name, display_name),
      ride_signups(count),
      ride_tags(tag:tags(id, name, color))
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
    const location = ride.meeting_location as unknown as { name: string } | null;
    const pace = ride.pace_group as unknown as { id: string; name: string } | null;
    const signups = ride.ride_signups as unknown as { count: number }[];
    const creator = ride.creator as unknown as {
      full_name: string;
      display_name: string | null;
    } | null;
    const rideTags = ride.ride_tags as unknown as {
      tag: { id: string; name: string; color: string | null };
    }[];

    return {
      id: ride.id,
      title: ride.title,
      ride_date: ride.ride_date,
      start_time: ride.start_time,
      status: ride.status,
      capacity: ride.capacity as number | null,
      distance_km: (ride as Record<string, unknown>).distance_km as number | null,
      template_id: (ride as Record<string, unknown>).template_id as string | null,
      meeting_location_name: location?.name ?? null,
      pace_group_id: pace?.id ?? null,
      pace_group_name: pace?.name ?? null,
      tags: rideTags?.map((rt) => rt.tag).filter(Boolean) ?? [],
      signup_count: signups?.[0]?.count ?? 0,
      created_by_name: creator?.display_name ?? creator?.full_name ?? null,
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
      user:users!inner(id, full_name, display_name, avatar_url)
    `,
    )
    .eq('ride_id', rideId)
    .neq('status', 'cancelled')
    .order('signed_up_at', { ascending: true });

  if (error?.message) {
    console.error('Error fetching ride signups:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((signup) => {
    const user = signup.user as unknown as {
      id: string;
      full_name: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    return {
      id: signup.id,
      status: signup.status,
      signed_up_at: signup.signed_up_at,
      waitlist_position: signup.waitlist_position,
      user_id: user.id,
      user_name: user.display_name ?? user.full_name,
      avatar_url: user.avatar_url,
    };
  });
}

/**
 * Fetch a ride's current tag IDs (for edit form pre-fill).
 */
export async function getRideTagIds(rideId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('ride_tags').select('tag_id').eq('ride_id', rideId);
  return (data ?? []).map((rt) => rt.tag_id);
}

export type UserRideSignup = {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  pace_group_name: string | null;
  meeting_location_name: string | null;
  distance_km: number | null;
  signup_count: number;
  capacity: number | null;
  signed_up_at: string | null;
  waitlist_position: number | null;
  signup_status: 'confirmed' | 'waitlisted' | 'checked_in';
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
        id, title, ride_date, start_time, distance_km, capacity,
        meeting_location:meeting_locations(name),
        pace_group:pace_groups(name),
        ride_signups(count),
        ride_weather_snapshots(*)
      )
    `,
    )
    .eq('user_id', userId)
    .eq('ride.club_id', clubId);

  switch (filter) {
    case 'upcoming':
      query = query
        .eq('status', 'confirmed')
        .gte('ride.ride_date', today)
        .neq('ride.status', 'cancelled');
      break;
    case 'past':
      query = query.in('status', ['confirmed', 'checked_in']).lt('ride.ride_date', today);
      break;
    case 'waitlisted':
      query = query
        .eq('status', 'waitlisted')
        .gte('ride.ride_date', today)
        .neq('ride.status', 'cancelled');
      break;
  }

  const { data, error } = await query.order('ride(ride_date)', {
    ascending: filter !== 'past',
  });

  if (error?.message) {
    console.error('Error fetching user ride signups:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((signup) => {
    const ride = signup.ride as unknown as {
      id: string;
      title: string;
      ride_date: string;
      start_time: string;
      distance_km: number | null;
      capacity: number | null;
      meeting_location: { name: string } | null;
      pace_group: { name: string } | null;
      ride_signups: { count: number }[];
      ride_weather_snapshots: RideWeatherSnapshot | null;
    };

    return {
      id: ride.id,
      title: ride.title,
      ride_date: ride.ride_date,
      start_time: ride.start_time,
      pace_group_name: ride.pace_group?.name ?? null,
      meeting_location_name: ride.meeting_location?.name ?? null,
      distance_km: ride.distance_km,
      signup_count: ride.ride_signups?.[0]?.count ?? 0,
      capacity: ride.capacity,
      signed_up_at: signup.signed_up_at,
      waitlist_position: signup.waitlist_position,
      signup_status: signup.status as UserRideSignup['signup_status'],
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
      user:users!inner(full_name, display_name, avatar_url)
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
      display_name: string | null;
      avatar_url: string | null;
    };
    return {
      id: comment.id,
      ride_id: comment.ride_id,
      user_id: comment.user_id,
      body: comment.body,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user_name: user.display_name ?? user.full_name,
      avatar_url: user.avatar_url,
    };
  });
}

/**
 * Fetch pickup locations for a ride, ordered by sort_order.
 */
export async function getRidePickups(rideId: string): Promise<RidePickupWithLocation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ride_pickups')
    .select(
      `
      id, ride_id, location_id, pickup_time, notes, sort_order,
      location:meeting_locations!inner(name, address)
    `,
    )
    .eq('ride_id', rideId)
    .order('sort_order', { ascending: true });

  if (error?.message) {
    console.error('Error fetching ride pickups:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((pickup) => ({
    ...pickup,
    location: pickup.location as unknown as { name: string; address: string | null },
  })) as RidePickupWithLocation[];
}
