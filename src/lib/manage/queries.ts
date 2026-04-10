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
 * Count announcements published in the last 7 days.
 */
export async function getRecentAnnouncementCount(clubId: string): Promise<number> {
  const supabase = await createClient();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .gte('published_at', weekAgo.toISOString());
  return count ?? 0;
}

/**
 * Stats for the admin dashboard section cards.
 */
export interface SectionCardStats {
  upcomingRides: number;
  activeMembers: number;
  recentAnnouncements: number;
}

export async function getSectionCardStats(clubId: string): Promise<SectionCardStats> {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const [ridesResult, membersResult, announcementsCount] = await Promise.all([
    supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .neq('status', 'cancelled')
      .gte('ride_date', todayStr),
    supabase
      .from('club_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('status', 'active'),
    getRecentAnnouncementCount(clubId),
  ]);

  return {
    upcomingRides: ridesResult.count ?? 0,
    activeMembers: membersResult.count ?? 0,
    recentAnnouncements: announcementsCount,
  };
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
      id, title, body, is_pinned, published_at, announcement_type, is_dismissible,
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
      announcement_type: (a.announcement_type as AnnouncementType) ?? 'general',
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
    const pace = t.pace_group as unknown as { name: string } | null;
    const raw = t as Record<string, unknown>;
    return {
      ...t,
      start_location_name: (raw.default_start_location_name as string) ?? null,
      pace_group_name: pace?.name ?? null,
    };
  });
}

/**
 * Fetch the pinned announcement for a club (max one).
 * Filters out announcements the user has already dismissed.
 */
export async function getPinnedAnnouncement(clubId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('announcements')
    .select(
      `
      id, title, body, published_at, announcement_type, is_dismissible,
      creator:users!announcements_created_by_fkey(full_name)
    `,
    )
    .eq('club_id', clubId)
    .eq('is_pinned', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  // Check if this user has dismissed this announcement
  const { data: dismissal } = await supabase
    .from('announcement_dismissals')
    .select('id')
    .eq('announcement_id', data.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (dismissal) return null;

  const creator = data.creator as unknown as {
    full_name: string;
  } | null;
  return {
    id: data.id,
    title: data.title,
    body: data.body,
    published_at: data.published_at,
    announcement_type: (data.announcement_type as AnnouncementType) ?? 'general',
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

// ---------------------------------------------------------------------------
// Admin Dashboard Stats
// ---------------------------------------------------------------------------

export interface AdminDashboardStats {
  fillRate: number;
  fillRateChange: number;
  cancellationRate: number;
  newThisMonth: number;
  waitlistDemand: number;
  cancellationsThisMonth: number;
}

export async function getAdminDashboardStats(clubId: string): Promise<AdminDashboardStats> {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [ridesResult, cancellationResult, newMembersResult] = await Promise.all([
    // Upcoming rides with signup statuses (for fill rate + waitlist)
    supabase
      .from('rides')
      .select('id, capacity, ride_date, ride_signups(status)')
      .eq('club_id', clubId)
      .neq('status', 'cancelled')
      .gte('ride_date', todayStr),

    // All signups on rides from the last 30 days (for cancellation rate)
    supabase
      .from('rides')
      .select('id, capacity, ride_signups(status)')
      .eq('club_id', clubId)
      .neq('status', 'cancelled')
      .gte('ride_date', thirtyDaysAgoStr),

    // New members this calendar month
    (() => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      return supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .gte('joined_at', monthStart.toISOString());
    })(),
  ]);

  const rides = ridesResult.data ?? [];

  // Fill rate: avg confirmed/capacity across upcoming rides with a capacity
  let fillRate = 0;
  const ridesWithCapacity = rides.filter((r) => r.capacity != null && r.capacity > 0);
  if (ridesWithCapacity.length > 0) {
    const totalFill = ridesWithCapacity.reduce((sum, r) => {
      const signups = (r.ride_signups as { status: string }[]) ?? [];
      const confirmed = signups.filter(
        (s) => s.status === 'confirmed' || s.status === 'checked_in',
      ).length;
      return sum + confirmed / r.capacity!;
    }, 0);
    fillRate = Math.round((totalFill / ridesWithCapacity.length) * 100);
  }

  // Fill rate change: compare upcoming fill rate against last-30-day fill rate
  const recentRides = cancellationResult.data ?? [];
  let pastFillRate = 0;
  const pastRidesWithCapacity = recentRides.filter((r) => r.capacity != null && r.capacity > 0);
  if (pastRidesWithCapacity.length > 0) {
    const pastTotalFill = pastRidesWithCapacity.reduce((sum, r) => {
      const signups = (r.ride_signups as { status: string }[]) ?? [];
      const confirmed = signups.filter(
        (s) => s.status === 'confirmed' || s.status === 'checked_in',
      ).length;
      return sum + confirmed / r.capacity!;
    }, 0);
    pastFillRate = Math.round((pastTotalFill / pastRidesWithCapacity.length) * 100);
  }
  const fillRateChange = fillRate - pastFillRate;

  // Cancellation rate: cancelled signups / total signups across last 30 days
  let cancellationRate = 0;
  let totalSignups = 0;
  let cancelledSignups = 0;
  for (const r of recentRides) {
    const signups = (r.ride_signups as { status: string }[]) ?? [];
    totalSignups += signups.length;
    cancelledSignups += signups.filter((s) => s.status === 'cancelled').length;
  }
  if (totalSignups > 0) {
    cancellationRate = Math.round((cancelledSignups / totalSignups) * 100);
  }

  // Cancellations this month (for trend badge context — uses same 30-day window)
  const cancellationsThisMonth = cancelledSignups;

  // Waitlist demand: total waitlisted signups across upcoming rides
  const waitlistDemand = rides.reduce((sum, r) => {
    const signups = (r.ride_signups as { status: string }[]) ?? [];
    return sum + signups.filter((s) => s.status === 'waitlisted').length;
  }, 0);

  const newThisMonth = newMembersResult.count ?? 0;

  return {
    fillRate,
    fillRateChange,
    cancellationRate,
    newThisMonth,
    waitlistDemand,
    cancellationsThisMonth,
  };
}

// ---------------------------------------------------------------------------
// Recent Activity Feed
// ---------------------------------------------------------------------------

export interface ActivityEvent {
  id: string;
  type: 'signup' | 'cancellation' | 'new_member';
  userName: string;
  userId: string;
  avatarUrl: string | null;
  detail: string;
  rideId: string | null;
  timestamp: string;
}

export async function getRecentActivity(clubId: string, limit = 10): Promise<ActivityEvent[]> {
  const supabase = await createClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

  const [signupsResult, membersResult] = await Promise.all([
    // Recent signups and cancellations
    supabase
      .from('ride_signups')
      .select(
        `id, user_id, status, signed_up_at, cancelled_at,
        user:users!ride_signups_user_id_fkey(full_name, avatar_url),
        ride:rides!inner(id, title, club_id)`,
      )
      .eq('ride.club_id', clubId)
      .or(`signed_up_at.gte.${sevenDaysAgoStr},cancelled_at.gte.${sevenDaysAgoStr}`)
      .order('signed_up_at', { ascending: false })
      .limit(20),

    // New members
    supabase
      .from('club_memberships')
      .select('user_id, joined_at, user:users!club_memberships_user_id_fkey(full_name, avatar_url)')
      .eq('club_id', clubId)
      .gte('joined_at', thirtyDaysAgoStr)
      .order('joined_at', { ascending: false })
      .limit(10),
  ]);

  const events: ActivityEvent[] = [];

  // Process signups/cancellations
  for (const row of signupsResult.data ?? []) {
    const user = row.user as unknown as { full_name: string; avatar_url: string | null } | null;
    const ride = row.ride as unknown as { id: string; title: string } | null;
    if (!user || !ride) continue;

    if (row.status === 'cancelled' && row.cancelled_at) {
      events.push({
        id: `cancel-${row.id}`,
        type: 'cancellation',
        userName: user.full_name,
        userId: row.user_id,
        avatarUrl: user.avatar_url,
        detail: ride.title,
        rideId: ride.id,
        timestamp: row.cancelled_at,
      });
    } else if (row.status === 'confirmed' || row.status === 'checked_in') {
      events.push({
        id: `signup-${row.id}`,
        type: 'signup',
        userName: user.full_name,
        userId: row.user_id,
        avatarUrl: user.avatar_url,
        detail: ride.title,
        rideId: ride.id,
        timestamp: row.signed_up_at,
      });
    }
  }

  // Process new members
  for (const row of membersResult.data ?? []) {
    const user = row.user as unknown as { full_name: string; avatar_url: string | null } | null;
    if (!user) continue;

    events.push({
      id: `member-${row.user_id}`,
      type: 'new_member',
      userName: user.full_name,
      userId: row.user_id,
      avatarUrl: user.avatar_url,
      detail: '',
      rideId: null,
      timestamp: row.joined_at,
    });
  }

  // Sort by timestamp descending, take first N
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events.slice(0, limit);
}
