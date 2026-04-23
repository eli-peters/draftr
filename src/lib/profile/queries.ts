import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { tagProfile } from '@/lib/cache-tags';
import type { Gender, MemberRole } from '@/types/database';

/**
 * Lightweight profile for the app layout shell (nav avatar, preferences, onboarding check).
 * Cached per user; invalidated via tagProfile(userId).
 */
export async function getLayoutProfile(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('users')
        .select('full_name, email, avatar_url, onboarding_completed, user_preferences')
        .eq('id', userId)
        .single();

      if (error?.message) {
        console.error('[profile] Error fetching layout profile:', error.message);
        return null;
      }

      return data;
    },
    ['layout-profile', userId],
    { tags: [tagProfile(userId)], revalidate: 300 },
  )();
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  street_address_line_1: string | null;
  street_address_line_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  preferred_pace_group: string | null;
  created_at: string;
  role: MemberRole;
  club_name: string | null;
}

export interface UserMembership {
  id: string;
  member_number: string | null;
  membership_type: string | null;
  membership_subtype: string | null;
  status: string | null;
  club_affiliations: { club_id: string; club_name: string }[];
}

/**
 * Fetch the user's profile joined with their club membership.
 * Cached per user; invalidated via tagProfile(userId).
 * Both queries run in parallel inside the cache to eliminate the sequential waterfall.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();

      const [{ data: user, error: userError }, { data: membership, error: membershipError }] =
        await Promise.all([
          supabase
            .from('users')
            .select(
              `id, first_name, last_name, full_name, email, avatar_url, bio,
               phone_number, date_of_birth, gender,
               street_address_line_1, street_address_line_2, city, province, postal_code, country,
               emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
               preferred_pace_group, created_at`,
            )
            .eq('id', userId)
            .single(),
          supabase
            .from('club_memberships')
            .select('role, club:clubs(name)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single(),
        ]);

      if (userError?.message) {
        console.error('[profile] Error fetching user:', userError.message);
      }

      if (!user) return null;

      if (membershipError?.message && membershipError.code !== 'PGRST116') {
        console.error('[profile] Error fetching membership:', membershipError.message);
      }

      const club = membership?.club as unknown as { name: string } | null;
      const u = user as Record<string, unknown>;

      // Derive first_name / last_name from full_name if the migration hasn't landed yet
      const fullName = (u.full_name as string) ?? '';
      const spaceIdx = fullName.indexOf(' ');

      return {
        id: u.id as string,
        first_name:
          (u.first_name as string) ?? (spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName),
        last_name: (u.last_name as string) ?? (spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : ''),
        full_name: fullName,
        email: (u.email as string) ?? '',
        avatar_url: (u.avatar_url as string | null) ?? null,
        bio: (u.bio as string | null) ?? null,
        phone_number: (u.phone_number as string | null) ?? null,
        date_of_birth: (u.date_of_birth as string | null) ?? null,
        gender: (u.gender as Gender | null) ?? null,
        street_address_line_1: (u.street_address_line_1 as string | null) ?? null,
        street_address_line_2: (u.street_address_line_2 as string | null) ?? null,
        city: (u.city as string | null) ?? null,
        province: (u.province as string | null) ?? null,
        postal_code: (u.postal_code as string | null) ?? null,
        country: (u.country as string | null) ?? null,
        emergency_contact_name: (u.emergency_contact_name as string | null) ?? null,
        emergency_contact_phone: (u.emergency_contact_phone as string | null) ?? null,
        emergency_contact_relationship: (u.emergency_contact_relationship as string | null) ?? null,
        preferred_pace_group: (u.preferred_pace_group as string | null) ?? null,
        created_at: (u.created_at as string) ?? '',
        role: (membership?.role as MemberRole | undefined) ?? 'rider',
        club_name: club?.name ?? null,
      };
    },
    ['user-profile', userId],
    { tags: [tagProfile(userId)], revalidate: 300 },
  )();
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
 * Cached per user; invalidated via tagProfile(userId).
 */
export async function getUserProfileStats(userId: string): Promise<ProfileStats> {
  const today = new Date().toISOString().split('T')[0];

  return unstable_cache(
    async () => {
      const supabase = createAdminClient();

      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const lastMonthEnd = new Date(monthStart);
      lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
      const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
      const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
      const lastMonthEndStr = new Date(lastMonthEnd.getTime() + MS_PER_DAY)
        .toISOString()
        .split('T')[0];

      const [totalResult, thisMonthResult, lastMonthResult] = await Promise.all([
        supabase
          .from('ride_signups')
          .select('*, ride:rides!inner(ride_date)', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['confirmed', 'checked_in'])
          .lt('ride.ride_date', today),
        supabase
          .from('ride_signups')
          .select('*, ride:rides!inner(ride_date)', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['confirmed', 'checked_in'])
          .gte('ride.ride_date', monthStartStr)
          .lt('ride.ride_date', today),
        supabase
          .from('ride_signups')
          .select('*, ride:rides!inner(ride_date)', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['confirmed', 'checked_in'])
          .gte('ride.ride_date', lastMonthStartStr)
          .lt('ride.ride_date', lastMonthEndStr),
      ]);

      if (totalResult.error?.message) {
        console.error('[profile] Error fetching total rides:', totalResult.error.message);
      }
      if (thisMonthResult.error?.message) {
        console.error('[profile] Error fetching this month rides:', thisMonthResult.error.message);
      }
      if (lastMonthResult.error?.message) {
        console.error('[profile] Error fetching last month rides:', lastMonthResult.error.message);
      }

      return {
        totalRides: totalResult.count ?? 0,
        ridesThisMonth: thisMonthResult.count ?? 0,
        ridesLastMonth: lastMonthResult.count ?? 0,
      };
    },
    ['user-profile-stats', userId, today],
    { tags: [tagProfile(userId)], revalidate: 300 },
  )();
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

/**
 * Fetch external memberships (CCN/OCA) for a user, with club affiliations.
 * Cached per user; invalidated via tagProfile(userId).
 */
export async function getUserMemberships(userId: string): Promise<UserMembership[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('memberships')
        .select(
          `
          id, member_number, membership_type, membership_subtype, status,
          affiliations:membership_club_affiliations(club_id, club:clubs(name))
        `,
        )
        .eq('user_id', userId);

      if (error?.message) {
        console.error('[profile] Error fetching memberships:', error.message);
        return [];
      }

      return (data ?? []).map((m) => {
        const affiliations = (m.affiliations ?? []) as unknown as {
          club_id: string;
          club: { name: string } | { name: string }[];
        }[];
        return {
          id: m.id,
          member_number: m.member_number,
          membership_type: m.membership_type,
          membership_subtype: m.membership_subtype,
          status: m.status,
          club_affiliations: affiliations.map((a) => ({
            club_id: a.club_id,
            club_name: Array.isArray(a.club) ? (a.club[0]?.name ?? '') : (a.club?.name ?? ''),
          })),
        };
      });
    },
    ['user-memberships', userId],
    { tags: [tagProfile(userId)], revalidate: 600 },
  )();
}
