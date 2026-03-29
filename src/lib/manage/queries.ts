import { createClient } from '@/lib/supabase/server';
import type { AnnouncementType } from '@/types/database';

export interface ClubMember {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  preferred_pace_group: string | null;
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
      user:users!club_memberships_user_id_fkey(full_name, email, avatar_url, preferred_pace_group)
    `,
    )
    .eq('club_id', clubId)
    .order('joined_at', { ascending: true });

  if (error?.message) {
    console.error('Error fetching club members:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((m) => {
    const user = m.user as unknown as {
      full_name: string;
      email: string;
      avatar_url: string | null;
      preferred_pace_group: string | null;
    };
    return {
      user_id: m.user_id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      preferred_pace_group: user.preferred_pace_group,
      role: m.role,
      status: m.status,
      joined_at: m.joined_at,
    };
  });
}

// ---------------------------------------------------------------------------
// Pace Tiers with usage
// ---------------------------------------------------------------------------

export interface PaceTierWithUsage {
  id: string;
  name: string;
  sort_order: number;
  moving_pace_min: number | null;
  moving_pace_max: number | null;
  strava_pace_min: number | null;
  strava_pace_max: number | null;
  typical_distance_min: number | null;
  typical_distance_max: number | null;
  upcoming_ride_count: number;
}

export async function getPaceTiersWithUsage(clubId: string): Promise<PaceTierWithUsage[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: tiers } = await supabase
    .from('pace_groups')
    .select(
      'id, name, sort_order, moving_pace_min, moving_pace_max, strava_pace_min, strava_pace_max, typical_distance_min, typical_distance_max',
    )
    .eq('club_id', clubId)
    .order('sort_order');

  if (!tiers || tiers.length === 0) return [];

  // Count upcoming rides per pace group
  const tierIds = tiers.map((t) => t.id);
  const { data: rides } = await supabase
    .from('rides')
    .select('pace_group_id')
    .eq('club_id', clubId)
    .in('pace_group_id', tierIds)
    .gte('ride_date', today)
    .neq('status', 'cancelled');

  const countMap = new Map<string, number>();
  for (const r of rides ?? []) {
    if (r.pace_group_id) {
      countMap.set(r.pace_group_id, (countMap.get(r.pace_group_id) ?? 0) + 1);
    }
  }

  return tiers.map((t) => ({
    ...t,
    upcoming_ride_count: countMap.get(t.id) ?? 0,
  }));
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
 * Fetch announcements for a club (admin panel).
 */
export async function getClubAnnouncements(clubId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .select(
      `
      id, title, body, is_pinned, published_at, expires_at,
      announcement_type, is_dismissible,
      creator:users!announcements_created_by_fkey(full_name)
    `,
    )
    .eq('club_id', clubId)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false });

  if (error?.message) {
    console.error('Error fetching announcements:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((a) => {
    const creator = a.creator as unknown as {
      full_name: string;
    } | null;
    return {
      id: a.id,
      title: a.title,
      body: a.body,
      is_pinned: a.is_pinned,
      published_at: a.published_at,
      expires_at: a.expires_at,
      announcement_type: a.announcement_type as AnnouncementType,
      is_dismissible: a.is_dismissible,
      created_by_name: creator?.full_name ?? null,
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
      default_start_location_name,
      season_start_date, season_end_date,
      meeting_location:meeting_locations(name),
      pace_group:pace_groups(name)
    `,
    )
    .eq('club_id', clubId)
    .order('is_active', { ascending: false })
    .order('title');

  if (error?.message) {
    console.error('Error fetching ride templates:', error.message, error.code, error.details);
    return [];
  }

  return (data ?? []).map((t) => {
    const location = t.meeting_location as unknown as { name: string } | null;
    const pace = t.pace_group as unknown as { name: string } | null;
    const raw = t as Record<string, unknown>;
    return {
      ...t,
      meeting_location_name: (raw.default_start_location_name as string) ?? location?.name ?? null,
      pace_group_name: pace?.name ?? null,
    };
  });
}

/**
 * Fetch the pinned announcement for a club (max one).
 * Filters out expired announcements and announcements the user has dismissed.
 */
export async function getPinnedAnnouncement(clubId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('announcements')
    .select(
      `
      id, title, body, published_at, expires_at, max_duration_days,
      announcement_type, is_dismissible,
      creator:users!announcements_created_by_fkey(full_name)
    `,
    )
    .eq('club_id', clubId)
    .eq('is_pinned', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  // Check max_duration_days safety guardrail (expires_at already filtered in query)
  const now = new Date();
  if (!data.expires_at && data.max_duration_days) {
    const published = new Date(data.published_at);
    const guardrailExpiry = new Date(published);
    guardrailExpiry.setDate(guardrailExpiry.getDate() + data.max_duration_days);
    if (guardrailExpiry < now) return null;
  }

  // Check if this user has dismissed this announcement
  if (data.is_dismissible) {
    const { data: dismissal } = await supabase
      .from('announcement_dismissals')
      .select('id')
      .eq('announcement_id', data.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (dismissal) return null;
  }

  const creator = data.creator as unknown as {
    full_name: string;
  } | null;
  return {
    id: data.id,
    title: data.title,
    body: data.body,
    published_at: data.published_at,
    announcement_type: data.announcement_type as AnnouncementType,
    is_dismissible: data.is_dismissible,
    created_by_name: creator?.full_name ?? null,
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
