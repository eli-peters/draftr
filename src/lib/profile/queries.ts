import { createClient } from '@/lib/supabase/server';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  preferred_pace_group: string | null;
  created_at: string;
  role: string;
  club_name: string | null;
}

/**
 * Fetch the user's profile joined with their club membership.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select(
      'id, full_name, email, avatar_url, bio, phone_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, preferred_pace_group, created_at',
    )
    .eq('id', userId)
    .single();

  if (userError?.message) {
    console.error('[profile] Error fetching user:', userError.message);
  }

  if (!user) return null;

  const { data: membership, error: membershipError } = await supabase
    .from('club_memberships')
    .select('role, club:clubs(name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (membershipError?.message && membershipError.code !== 'PGRST116') {
    console.error('[profile] Error fetching membership:', membershipError.message);
  }

  const club = membership?.club as unknown as { name: string } | null;

  return {
    ...user,
    role: membership?.role ?? 'rider',
    club_name: club?.name ?? null,
  };
}

export interface ProfileStats {
  totalRides: number;
  ridesThisMonth: number;
  ridesLastMonth: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * Fetch ride stats for the user's profile.
 * Distance/elevation are Phase 3 (require ride completion tracking).
 */
export async function getUserProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient();

  // Total rides (confirmed or checked_in, past dates only)
  const today = new Date().toISOString().split('T')[0];

  const { count: totalRides, error: totalError } = await supabase
    .from('ride_signups')
    .select('*, ride:rides!inner(ride_date)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['confirmed', 'checked_in'])
    .lt('ride.ride_date', today);

  if (totalError?.message) {
    console.error('[profile] Error fetching total rides:', totalError.message);
  }

  // Rides this month
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const { count: ridesThisMonth, error: thisMonthError } = await supabase
    .from('ride_signups')
    .select('*, ride:rides!inner(ride_date)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['confirmed', 'checked_in'])
    .gte('ride.ride_date', monthStartStr)
    .lt('ride.ride_date', today);

  if (thisMonthError?.message) {
    console.error('[profile] Error fetching this month rides:', thisMonthError.message);
  }

  // Rides last month (for delta badge)
  const lastMonthEnd = new Date(monthStart);
  lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
  const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
  const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
  const lastMonthEndStr = new Date(lastMonthEnd.getTime() + MS_PER_DAY).toISOString().split('T')[0];

  const { count: ridesLastMonth, error: lastMonthError } = await supabase
    .from('ride_signups')
    .select('*, ride:rides!inner(ride_date)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['confirmed', 'checked_in'])
    .gte('ride.ride_date', lastMonthStartStr)
    .lt('ride.ride_date', lastMonthEndStr);

  if (lastMonthError?.message) {
    console.error('[profile] Error fetching last month rides:', lastMonthError.message);
  }

  return {
    totalRides: totalRides ?? 0,
    ridesThisMonth: ridesThisMonth ?? 0,
    ridesLastMonth: ridesLastMonth ?? 0,
  };
}

export interface RecentRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  distance_km: number | null;
  elevation_m: number | null;
  route_polyline: string | null;
  pace_group: { name: string; sort_order: number } | null;
}

interface RawRecentRideRow {
  ride: {
    id: string;
    title: string;
    ride_date: string;
    start_time: string;
    distance_km: number | null;
    elevation_m: number | null;
    route_polyline: string | null;
    pace_group:
      | { name: string; sort_order: number }
      | { name: string; sort_order: number }[]
      | null;
  };
}

/**
 * Fetch the user's recent past rides — enriched with the data needed by the
 * shared ride card visual language (pace badge, metadata row, map thumbnail).
 */
export async function getUserRecentRides(userId: string, limit = 5): Promise<RecentRide[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ride_signups')
    .select(
      `
      ride:rides!inner(
        id,
        title,
        ride_date,
        start_time,
        distance_km,
        elevation_m,
        route_polyline,
        pace_group:pace_groups(name, sort_order)
      )
    `,
    )
    .eq('user_id', userId)
    .in('status', ['confirmed', 'checked_in'])
    .lt('ride.ride_date', today)
    .order('ride(ride_date)', { ascending: false })
    .limit(limit);

  if (error?.message) {
    console.error('[profile] Error fetching recent rides:', error.message);
    return [];
  }

  return ((data ?? []) as unknown as RawRecentRideRow[]).map((signup) => {
    const raw = signup.ride;
    // Supabase foreign-table joins return either an object or a single-item array
    // depending on the schema hint; normalize to a flat object.
    const paceGroup = Array.isArray(raw.pace_group) ? (raw.pace_group[0] ?? null) : raw.pace_group;
    return {
      id: raw.id,
      title: raw.title,
      ride_date: raw.ride_date,
      start_time: raw.start_time,
      distance_km: raw.distance_km,
      elevation_m: raw.elevation_m,
      route_polyline: raw.route_polyline,
      pace_group: paceGroup,
    };
  });
}
