import { createClient } from "@/lib/supabase/server";
import type { RideWithDetails } from "@/types/database";

/**
 * Fetch upcoming rides for a club, with joined relations.
 */
export async function getUpcomingRides(clubId: string): Promise<RideWithDetails[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("rides")
    .select(`
      *,
      meeting_location:meeting_locations(*),
      pace_group:pace_groups(*),
      ride_tags(tag:tags(*)),
      creator:users!rides_created_by_fkey(id, full_name, display_name, avatar_url),
      ride_signups(count)
    `)
    .eq("club_id", clubId)
    .gte("ride_date", today)
    .neq("status", "cancelled")
    .order("ride_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching rides:", error);
    return [];
  }

  return (data ?? []).map((ride) => ({
    ...ride,
    tags: ride.ride_tags?.map((rt: { tag: unknown }) => rt.tag).filter(Boolean) ?? [],
    signup_count: ride.ride_signups?.[0]?.count ?? 0,
    creator: ride.creator ?? null,
  })) as RideWithDetails[];
}

/**
 * Fetch a single ride by ID with full details.
 */
export async function getRideById(rideId: string): Promise<RideWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rides")
    .select(`
      *,
      meeting_location:meeting_locations(*),
      pace_group:pace_groups(*),
      ride_tags(tag:tags(*)),
      creator:users!rides_created_by_fkey(id, full_name, display_name, avatar_url),
      ride_signups(count)
    `)
    .eq("id", rideId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    tags: data.ride_tags?.map((rt: { tag: unknown }) => rt.tag).filter(Boolean) ?? [],
    signup_count: data.ride_signups?.[0]?.count ?? 0,
    creator: data.creator ?? null,
  } as RideWithDetails;
}

/**
 * Check if the current user is signed up for a ride.
 */
export async function getUserSignupStatus(rideId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("ride_signups")
    .select("id, status")
    .eq("ride_id", rideId)
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .maybeSingle();

  return data;
}

/**
 * Get the user's club membership (first active club).
 */
export async function getUserClubMembership() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("club_memberships")
    .select("*, club:clubs(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  return data;
}
