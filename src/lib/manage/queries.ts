import { createClient } from "@/lib/supabase/server";

export interface ClubMember {
  user_id: string;
  full_name: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  status: string;
  joined_at: string;
}

/**
 * Fetch all members of a club with user details.
 */
export async function getClubMembers(clubId: string): Promise<ClubMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("club_memberships")
    .select(`
      user_id, role, status, joined_at,
      user:users!club_memberships_user_id_fkey(full_name, display_name, email, avatar_url)
    `)
    .eq("club_id", clubId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Error fetching club members:", error);
    return [];
  }

  return (data ?? []).map((m) => {
    const user = m.user as unknown as {
      full_name: string; display_name: string | null; email: string; avatar_url: string | null;
    };
    return {
      user_id: m.user_id,
      full_name: user.full_name,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      role: m.role,
      status: m.status,
      joined_at: m.joined_at,
    };
  });
}

export interface ClubStats {
  totalRides: number;
  activeMembers: number;
  signupsThisWeek: number;
}

/**
 * Fetch aggregate stats for the admin dashboard on the manage page.
 */
export async function getClubStats(clubId: string): Promise<ClubStats> {
  const supabase = await createClient();

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();

  // Total rides for this club (non-cancelled)
  const { count: totalRides } = await supabase
    .from("rides")
    .select("*", { count: "exact", head: true })
    .eq("club_id", clubId)
    .neq("status", "cancelled");

  // Active members
  const { count: activeMembers } = await supabase
    .from("club_memberships")
    .select("*", { count: "exact", head: true })
    .eq("club_id", clubId)
    .eq("status", "active");

  // Signups this week
  const { count: signupsThisWeek } = await supabase
    .from("ride_signups")
    .select("*, ride:rides!inner(club_id)", { count: "exact", head: true })
    .eq("ride.club_id", clubId)
    .eq("status", "confirmed")
    .gte("signed_up_at", weekAgoStr);

  return {
    totalRides: totalRides ?? 0,
    activeMembers: activeMembers ?? 0,
    signupsThisWeek: signupsThisWeek ?? 0,
  };
}
