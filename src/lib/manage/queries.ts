import { createClient } from '@/lib/supabase/server';

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
    .from('club_memberships')
    .select(
      `
      user_id, role, status, joined_at,
      user:users!club_memberships_user_id_fkey(full_name, display_name, email, avatar_url)
    `,
    )
    .eq('club_id', clubId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching club members:', error);
    return [];
  }

  return (data ?? []).map((m) => {
    const user = m.user as unknown as {
      full_name: string;
      display_name: string | null;
      email: string;
      avatar_url: string | null;
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

/**
 * Count pending member approvals for a club.
 */
export async function getPendingMemberCount(clubId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('club_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .eq('status', 'pending');
  return count ?? 0;
}

/**
 * Fetch announcements for a club.
 */
export async function getClubAnnouncements(clubId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .select(
      `
      id, title, body, is_pinned, published_at, expires_at,
      creator:users!announcements_created_by_fkey(display_name, full_name)
    `,
    )
    .eq('club_id', clubId)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }

  return (data ?? []).map((a) => {
    const creator = a.creator as unknown as {
      display_name: string | null;
      full_name: string;
    } | null;
    return {
      id: a.id,
      title: a.title,
      body: a.body,
      is_pinned: a.is_pinned,
      published_at: a.published_at,
      expires_at: a.expires_at,
      created_by_name: creator?.display_name ?? creator?.full_name ?? null,
    };
  });
}

/**
 * Fetch ride templates for a club.
 */
export async function getClubRideTemplates(clubId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ride_templates')
    .select(
      `
      id, title, description, day_of_week, start_time, is_drop_ride, is_active, recurrence,
      default_distance_km, default_capacity, default_route_url, default_route_name,
      season_start_date, season_end_date,
      meeting_location:meeting_locations(name),
      pace_group:pace_groups(name)
    `,
    )
    .eq('club_id', clubId)
    .order('is_active', { ascending: false })
    .order('title');

  if (error) {
    console.error('Error fetching ride templates:', error);
    return [];
  }

  return (data ?? []).map((t) => {
    const location = t.meeting_location as unknown as { name: string } | null;
    const pace = t.pace_group as unknown as { name: string } | null;
    return {
      ...t,
      meeting_location_name: location?.name ?? null,
      pace_group_name: pace?.name ?? null,
    };
  });
}

/**
 * Fetch the current pinned announcement for a club (max one).
 */
export async function getPinnedAnnouncement(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('announcements')
    .select(
      `
      id, title, body, published_at,
      creator:users!announcements_created_by_fkey(display_name, full_name)
    `,
    )
    .eq('club_id', clubId)
    .eq('is_pinned', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const creator = data.creator as unknown as {
    display_name: string | null;
    full_name: string;
  } | null;
  return {
    id: data.id,
    title: data.title,
    body: data.body,
    published_at: data.published_at,
    created_by_name: creator?.display_name ?? creator?.full_name ?? null,
  };
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
    .from('rides')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .neq('status', 'cancelled');

  // Active members
  const { count: activeMembers } = await supabase
    .from('club_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .eq('status', 'active');

  // Signups this week
  const { count: signupsThisWeek } = await supabase
    .from('ride_signups')
    .select('*, ride:rides!inner(club_id)', { count: 'exact', head: true })
    .eq('ride.club_id', clubId)
    .eq('status', 'confirmed')
    .gte('signed_up_at', weekAgoStr);

  return {
    totalRides: totalRides ?? 0,
    activeMembers: activeMembers ?? 0,
    signupsThisWeek: signupsThisWeek ?? 0,
  };
}
