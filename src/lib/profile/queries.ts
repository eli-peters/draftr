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

  const { data: user } = await supabase
    .from('users')
    .select(
      'id, full_name, email, avatar_url, bio, phone_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, preferred_pace_group, created_at',
    )
    .eq('id', userId)
    .single();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('club_memberships')
    .select('role, club:clubs(name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

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

/**
 * Fetch ride stats for the user's profile.
 * Distance/elevation are Phase 3 (require ride completion tracking).
 */
export async function getUserProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient();

  // Total rides (confirmed or checked_in, past dates only)
  const today = new Date().toISOString().split('T')[0];

  const { count: totalRides } = await supabase
    .from('ride_signups')
    .select('*, ride:rides!inner(ride_date)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['confirmed', 'checked_in'])
    .lt('ride.ride_date', today);

  // Rides this month
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const { count: ridesThisMonth } = await supabase
    .from('ride_signups')
    .select('*, ride:rides!inner(ride_date)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['confirmed', 'checked_in'])
    .gte('ride.ride_date', monthStartStr)
    .lt('ride.ride_date', today);

  // Rides last month (for delta badge)
  const lastMonthEnd = new Date(monthStart);
  lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
  const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
  const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
  const lastMonthEndStr = new Date(lastMonthEnd.getTime() + 86400000).toISOString().split('T')[0];

  const { count: ridesLastMonth } = await supabase
    .from('ride_signups')
    .select('*, ride:rides!inner(ride_date)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['confirmed', 'checked_in'])
    .gte('ride.ride_date', lastMonthStartStr)
    .lt('ride.ride_date', lastMonthEndStr);

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
  distance_km: number | null;
}

/**
 * Fetch the user's recent past rides.
 */
export async function getUserRecentRides(userId: string, limit = 5): Promise<RecentRide[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ride_signups')
    .select(
      `
      ride:rides!inner(id, title, ride_date, distance_km)
    `,
    )
    .eq('user_id', userId)
    .in('status', ['confirmed', 'checked_in'])
    .lt('ride.ride_date', today)
    .order('ride(ride_date)', { ascending: false })
    .limit(limit);

  if (error?.message) {
    console.error('Error fetching recent rides:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((signup) => {
    const ride = signup.ride as unknown as RecentRide;
    return ride;
  });
}
