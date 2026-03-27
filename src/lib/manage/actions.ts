'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getUser } from '@/lib/supabase/server';
import { appContent } from '@/content/app';
import type { AnnouncementType, MemberRole, MemberStatus } from '@/types/database';
import { parseLocalDate } from '@/config/formatting';
import { estimateEndTime } from '@/lib/rides/estimate-duration';

const { common, errors } = appContent;

/**
 * Update a club member's role.
 */
export async function updateMemberRole(clubId: string, userId: string, newRole: MemberRole) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  // Prevent self-demotion
  if (user.id === userId) return { error: errors.cannotDeactivateSelf };

  // Prevent demoting the last admin
  if (newRole !== 'admin') {
    const { data: currentMembership } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single();

    if (currentMembership?.role === 'admin') {
      const { count } = await supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('role', 'admin')
        .eq('status', 'active');

      if ((count ?? 0) <= 1) {
        return { error: errors.lastAdmin };
      }
    }
  }

  const { error } = await supabase
    .from('club_memberships')
    .update({ role: newRole })
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) return { error: error.message };

  revalidatePath('/manage');
  return { success: true };
}

/**
 * Deactivate a club member (set status to inactive).
 */
export async function deactivateMember(clubId: string, userId: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  // Prevent self-deactivation
  if (user.id === userId) return { error: errors.cannotDeactivateSelf };

  const { error } = await supabase
    .from('club_memberships')
    .update({ status: 'inactive' as MemberStatus })
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) return { error: error.message };

  revalidatePath('/manage');
  return { success: true };
}

/**
 * Reactivate a club member (set status to active).
 */
export async function reactivateMember(clubId: string, userId: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const { error } = await supabase
    .from('club_memberships')
    .update({ status: 'active' as MemberStatus })
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) return { error: error.message };

  revalidatePath('/manage');
  return { success: true };
}

/**
 * Approve a pending member (set status from pending to active).
 */
export async function approveMember(clubId: string, userId: string) {
  return reactivateMember(clubId, userId);
}

/**
 * Create a club announcement.
 */
export async function createAnnouncement(
  clubId: string,
  data: {
    title: string;
    body: string;
    announcement_type?: AnnouncementType;
    is_dismissible?: boolean;
    expires_at?: string | null;
  },
) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      club_id: clubId,
      created_by: user.id,
      title: data.title,
      body: data.body,
      announcement_type: data.announcement_type ?? 'info',
      is_dismissible: data.is_dismissible ?? true,
      expires_at: data.expires_at ?? null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  // Notify all club members
  const { data: members } = await supabase
    .from('club_memberships')
    .select('user_id')
    .eq('club_id', clubId)
    .eq('status', 'active');

  if (members && members.length > 0) {
    const notifications = members
      .filter((m) => m.user_id !== user.id)
      .map((m) => ({
        user_id: m.user_id,
        type: 'announcement',
        title: data.title,
        body: data.body.slice(0, 200),
        ride_id: null,
        channel: 'push',
      }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  }

  revalidatePath('/manage');
  revalidatePath('/notifications');
  return { success: true, id: announcement?.id };
}

/**
 * Update a club announcement.
 */
export async function updateAnnouncement(
  announcementId: string,
  data: {
    title: string;
    body: string;
    announcement_type?: AnnouncementType;
    is_dismissible?: boolean;
    expires_at?: string | null;
  },
) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const { error } = await supabase
    .from('announcements')
    .update({
      title: data.title,
      body: data.body,
      announcement_type: data.announcement_type ?? 'info',
      is_dismissible: data.is_dismissible ?? true,
      expires_at: data.expires_at ?? null,
    })
    .eq('id', announcementId);

  if (error) return { error: error.message };

  revalidatePath('/manage');
  return { success: true };
}

/**
 * Delete a club announcement.
 */
export async function deleteAnnouncement(announcementId: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const { error } = await supabase.from('announcements').delete().eq('id', announcementId);

  if (error) return { error: error.message };

  revalidatePath('/manage');
  return { success: true };
}

/**
 * Dismiss an announcement for the current user.
 * Persists the dismissal so it survives page refreshes and device switches.
 */
export async function dismissAnnouncement(announcementId: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const { error } = await supabase.from('announcement_dismissals').upsert(
    {
      announcement_id: announcementId,
      user_id: user.id,
    },
    { onConflict: 'announcement_id,user_id' },
  );

  if (error) return { error: error.message };

  revalidatePath('/');
  return { success: true };
}

/**
 * Toggle pin on an announcement.
 * Enforces one-pinned-max per club: pinning one unpins all others.
 */
export async function toggleAnnouncementPin(
  announcementId: string,
  isPinned: boolean,
  clubId: string,
) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  // Enforce one-pinned-max: unpin all others in this club first
  if (isPinned) {
    await supabase
      .from('announcements')
      .update({ is_pinned: false })
      .eq('club_id', clubId)
      .eq('is_pinned', true);
  }

  const { error } = await supabase
    .from('announcements')
    .update({ is_pinned: isPinned })
    .eq('id', announcementId);

  if (error) return { error: error.message };

  revalidatePath('/manage');
  revalidatePath('/');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Pace Tier Management
// ---------------------------------------------------------------------------

export async function addPaceTier(clubId: string, name: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  // Get max sort_order
  const { data: existing } = await supabase
    .from('pace_groups')
    .select('sort_order')
    .eq('club_id', clubId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from('pace_groups').insert({
    club_id: clubId,
    name: name.trim(),
    sort_order: nextOrder,
  });

  if (error) {
    if (error.code === '23505') return { error: appContent.manage.paceTiers.duplicateName };
    return { error: error.message };
  }

  revalidatePath('/manage');
  return { success: true };
}

export async function updatePaceTier(
  tierId: string,
  data: {
    name?: string;
    sort_order?: number;
    moving_pace_min?: number | null;
    moving_pace_max?: number | null;
    strava_pace_min?: number | null;
    strava_pace_max?: number | null;
    typical_distance_min?: number | null;
    typical_distance_max?: number | null;
  },
) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.sort_order !== undefined) updates.sort_order = data.sort_order;
  if (data.moving_pace_min !== undefined) updates.moving_pace_min = data.moving_pace_min;
  if (data.moving_pace_max !== undefined) updates.moving_pace_max = data.moving_pace_max;
  if (data.strava_pace_min !== undefined) updates.strava_pace_min = data.strava_pace_min;
  if (data.strava_pace_max !== undefined) updates.strava_pace_max = data.strava_pace_max;
  if (data.typical_distance_min !== undefined)
    updates.typical_distance_min = data.typical_distance_min;
  if (data.typical_distance_max !== undefined)
    updates.typical_distance_max = data.typical_distance_max;

  const { error } = await supabase.from('pace_groups').update(updates).eq('id', tierId);

  if (error) {
    if (error.code === '23505') return { error: appContent.manage.paceTiers.duplicateName };
    return { error: error.message };
  }

  revalidatePath('/manage');
  revalidatePath('/rides');
  return { success: true };
}

export async function deletePaceTier(tierId: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  // Block deletion if any rides or templates reference this tier
  const { count: rideCount } = await supabase
    .from('rides')
    .select('*', { count: 'exact', head: true })
    .eq('pace_group_id', tierId);

  const { count: templateCount } = await supabase
    .from('ride_templates')
    .select('*', { count: 'exact', head: true })
    .eq('pace_group_id', tierId);

  if ((rideCount ?? 0) > 0 || (templateCount ?? 0) > 0) {
    return { error: appContent.manage.paceTiers.cannotDelete };
  }

  // Look up club_id before deleting so we can renormalize sort_orders
  const { data: tier } = await supabase
    .from('pace_groups')
    .select('club_id')
    .eq('id', tierId)
    .single();

  const { error } = await supabase.from('pace_groups').delete().eq('id', tierId);
  if (error) return { error: error.message };

  // Renormalize sort_orders to close any gap left by the deletion
  if (tier?.club_id) {
    const { data: remaining } = await supabase
      .from('pace_groups')
      .select('id')
      .eq('club_id', tier.club_id)
      .order('sort_order');

    if (remaining) {
      await Promise.all(
        remaining.map((pg, i) =>
          supabase
            .from('pace_groups')
            .update({ sort_order: i + 1 })
            .eq('id', pg.id),
        ),
      );
    }
  }

  revalidatePath('/manage');
  revalidatePath('/rides');
  return { success: true };
}

export async function reorderPaceTiers(clubId: string, orderedIds: string[]) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  await Promise.all(
    orderedIds.map((id, i) =>
      supabase
        .from('pace_groups')
        .update({ sort_order: i + 1 })
        .eq('id', id)
        .eq('club_id', clubId),
    ),
  );

  revalidatePath('/manage');
  return { success: true };
}

/**
 * Update season dates for a club (admin only).
 * Stored in clubs.settings JSONB.
 */
export async function updateSeasonDates(clubId: string, seasonStart: string, seasonEnd: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  // Fetch existing settings and merge
  const { data: club } = await supabase.from('clubs').select('settings').eq('id', clubId).single();

  const existingSettings = (club?.settings ?? {}) as Record<string, unknown>;

  const { error } = await supabase
    .from('clubs')
    .update({
      settings: {
        ...existingSettings,
        season_start: seasonStart || null,
        season_end: seasonEnd || null,
      },
    })
    .eq('id', clubId);

  if (error) return { error: error.message };

  revalidatePath('/manage');
  return { success: true };
}

/**
 * Create a recurring ride.
 */
export async function createRecurringRide(
  clubId: string,
  data: {
    title: string;
    description?: string;
    day_of_week: number;
    start_time: string;
    recurrence: string;
    season_start_date?: string;
    season_end_date?: string;
    generate_weeks_ahead?: number;
    meeting_location_id?: string;
    pace_group_id?: string;
    default_distance_km?: number;
    default_capacity?: number;
    is_drop_ride?: boolean;
  },
) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const { data: template, error } = await supabase
    .from('ride_templates')
    .insert({
      club_id: clubId,
      created_by: user.id,
      title: data.title,
      description: data.description || null,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      recurrence: data.recurrence,
      season_start_date: data.season_start_date || null,
      season_end_date: data.season_end_date || null,
      generate_weeks_ahead: data.generate_weeks_ahead ?? 4,
      meeting_location_id: data.meeting_location_id || null,
      pace_group_id: data.pace_group_id || null,
      default_distance_km: data.default_distance_km ?? null,
      default_capacity: data.default_capacity ?? null,
      is_drop_ride: data.is_drop_ride ?? false,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  // Auto-generate initial rides
  if (template) {
    await generateRidesFromRecurring(template.id);
  }

  revalidatePath('/manage');
  revalidatePath('/rides');
  revalidatePath('/');
  return { success: true };
}

/**
 * Format a Date as YYYY-MM-DD in local time.
 */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generate ride instances from a recurring ride template.
 * Respects season bounds, end conditions (occurrences or end date), and deduplicates.
 */
export async function generateRidesFromRecurring(templateId: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const { data: template } = await supabase
    .from('ride_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template || !template.recurrence || template.day_of_week == null) {
    return { error: appContent.errors.rideNotFound };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine the generation window
  const maxWeeks = template.generate_weeks_ahead ?? 12;
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + maxWeeks * 7);

  // Respect season bounds
  const seasonStart = template.season_start_date
    ? parseLocalDate(template.season_start_date)
    : today;
  const seasonEnd = template.season_end_date ? parseLocalDate(template.season_end_date) : windowEnd;

  // Respect end_date on template (Outlook "end on date")
  const templateEnd = template.end_date ? parseLocalDate(template.end_date) : null;

  const startFrom = seasonStart > today ? seasonStart : today;
  let generateUntil = seasonEnd < windowEnd ? seasonEnd : windowEnd;
  if (templateEnd && templateEnd < generateUntil) {
    generateUntil = templateEnd;
  }

  const startStr = formatLocalDate(startFrom);
  const endStr = formatLocalDate(generateUntil);

  // Count existing rides from this template (for "end after X occurrences")
  const { count: existingTotal } = await supabase
    .from('rides')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', templateId)
    .neq('status', 'cancelled');

  const maxOccurrences = template.end_after_occurrences ?? Infinity;
  let remainingSlots = maxOccurrences - (existingTotal ?? 0);
  if (remainingSlots <= 0) return { success: true, count: 0 };

  // Find existing ride dates to deduplicate
  const { data: existingRides } = await supabase
    .from('rides')
    .select('ride_date')
    .eq('template_id', templateId)
    .neq('status', 'cancelled')
    .gte('ride_date', startStr)
    .lte('ride_date', endStr);

  const existingDates = new Set((existingRides ?? []).map((r) => r.ride_date));

  // Build list of dates to create
  const datesToCreate: string[] = [];
  const cursor = new Date(startFrom);

  // Advance to the next matching day_of_week
  while (cursor.getDay() !== template.day_of_week) {
    cursor.setDate(cursor.getDate() + 1);
  }

  while (cursor <= generateUntil && remainingSlots > 0) {
    const dateStr = formatLocalDate(cursor);
    if (!existingDates.has(dateStr)) {
      datesToCreate.push(dateStr);
      remainingSlots--;
    }

    // Advance cursor based on recurrence type
    if (template.recurrence === 'monthly') {
      cursor.setMonth(cursor.getMonth() + 1);
      // Keep same day-of-week within the month
      while (cursor.getDay() !== template.day_of_week) {
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      const increment = template.recurrence === 'biweekly' ? 14 : 7;
      cursor.setDate(cursor.getDate() + increment);
    }
  }

  if (datesToCreate.length === 0) {
    return { success: true, count: 0 };
  }

  // Estimate end_time from template's distance + pace group
  let endTime: string | null = null;
  if (template.pace_group_id && template.default_distance_km) {
    const { data: pg } = await supabase
      .from('pace_groups')
      .select('moving_pace_min, moving_pace_max')
      .eq('id', template.pace_group_id)
      .single();
    if (pg) {
      endTime = estimateEndTime(template.default_distance_km, pg, template.start_time);
    }
  }

  // Bulk insert rides
  const rides = datesToCreate.map((date) => ({
    club_id: template.club_id,
    created_by: template.created_by,
    title: template.title,
    description: template.description,
    ride_date: date,
    start_time: template.start_time,
    end_time: endTime,
    meeting_location_id: template.meeting_location_id,
    pace_group_id: template.pace_group_id,
    distance_km: template.default_distance_km,
    capacity: template.default_capacity,
    is_drop_ride: template.is_drop_ride,
    status: 'scheduled',
    template_id: template.id,
  }));

  await supabase.from('rides').insert(rides);

  // Update last_generated_date
  await supabase
    .from('ride_templates')
    .update({ last_generated_date: formatLocalDate(new Date()) })
    .eq('id', templateId);

  revalidatePath('/manage');
  revalidatePath('/rides');
  revalidatePath('/');
  return { success: true, count: datesToCreate.length };
}

/**
 * Toggle a recurring ride active/paused.
 */
export async function toggleRecurringRide(templateId: string, isActive: boolean) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const { error } = await supabase
    .from('ride_templates')
    .update({ is_active: isActive })
    .eq('id', templateId);

  if (error) return { error: error.message };

  revalidatePath('/manage');
  return { success: true };
}

/**
 * Delete a recurring ride (and optionally future generated rides).
 */
export async function deleteRecurringRide(templateId: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  // Delete future unmodified rides from this template (no signups)
  const today = new Date().toISOString().split('T')[0];
  await supabase
    .from('rides')
    .delete()
    .eq('template_id', templateId)
    .gte('ride_date', today)
    .eq('status', 'scheduled');

  const { error } = await supabase.from('ride_templates').delete().eq('id', templateId);

  if (error) return { error: error.message };

  revalidatePath('/manage');
  revalidatePath('/rides');
  revalidatePath('/');
  return { success: true };
}
