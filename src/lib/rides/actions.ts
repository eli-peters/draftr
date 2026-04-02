'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { appContent } from '@/content/app';
import { RideStatus } from '@/config/statuses';
import { getRideAvailability } from '@/lib/rides/lifecycle';
import { estimateEndTime } from '@/lib/rides/estimate-duration';
import { todayDateString } from '@/config/formatting';
import { syncWeatherForRide } from '@/lib/weather/sync';

const { errors, common, notificationMessages: notif, rides: ridesContent } = appContent;

/**
 * Verify the caller has permission to modify a ride.
 * Returns an error string if denied, null if allowed.
 */
async function checkRideEditPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  rideId: string,
): Promise<string | null> {
  const { data: membership } = await supabase
    .from('club_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!membership) return errors.notAuthorized;

  const role = membership.role;
  if (role !== 'ride_leader' && role !== 'admin') return errors.notAuthorized;

  // Admins can edit any ride; leaders can only edit rides they created or co-lead
  if (role === 'ride_leader') {
    const { data: ride } = await supabase
      .from('rides')
      .select('created_by')
      .eq('id', rideId)
      .single();

    if (ride?.created_by !== userId) {
      // Check if user is a co-leader
      const { data: coLeader } = await supabase
        .from('ride_leaders')
        .select('id')
        .eq('ride_id', rideId)
        .eq('user_id', userId)
        .single();

      if (!coLeader) return errors.notAuthorized;
    }
  }

  return null;
}

/**
 * Sign up for a ride. Handles capacity and waitlisting.
 */
export async function signUpForRide(rideId: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { error: common.notAuthenticated };
  }

  const { data: ride } = await supabase
    .from('rides')
    .select(
      'id, title, capacity, status, created_by, ride_date, start_time, end_time, club:clubs(timezone)',
    )
    .eq('id', rideId)
    .single();

  if (!ride) {
    return { error: errors.rideNotFound };
  }

  const timezone =
    (ride.club as unknown as { timezone: string } | null)?.timezone ?? 'America/Toronto';

  // Count current confirmed signups
  const { count } = await supabase
    .from('ride_signups')
    .select('*', { count: 'exact', head: true })
    .eq('ride_id', rideId)
    .eq('status', 'confirmed');

  const currentCount = count ?? 0;

  // Count existing waitlisted riders to determine next position
  const { count: waitlistedCount } = await supabase
    .from('ride_signups')
    .select('*', { count: 'exact', head: true })
    .eq('ride_id', rideId)
    .eq('status', 'waitlisted');

  // Check availability — enforces cancelled check + timing cutoff
  const availability = getRideAvailability(ride, currentCount, timezone);
  if (!availability.canSignUp) {
    if (availability.isCancelled) return { error: errors.rideCancelled };
    return { error: errors.signupClosed };
  }

  const isFull = availability.isFull;

  const { error } = await supabase.from('ride_signups').upsert(
    {
      ride_id: rideId,
      user_id: user.id,
      status: isFull ? 'waitlisted' : 'confirmed',
      waitlist_position: isFull ? (waitlistedCount ?? 0) + 1 : null,
      signed_up_at: new Date().toISOString(),
      cancelled_at: null,
    },
    { onConflict: 'ride_id,user_id' },
  );

  if (error) {
    return { error: error.message };
  }

  // Create notification for the rider
  if (!isFull) {
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'signup_confirmed',
      title: notif.signupConfirmed.title(ride.title),
      body: null,
      ride_id: rideId,
      channel: 'push',
    });
    if (notifError?.message) {
      console.error('Failed to create signup notification:', notifError.message);
    }
  }

  // Notify the ride leader when a rider joins the waitlist
  // Uses admin client — RLS doesn't allow riders to insert notifications for other users
  if (isFull) {
    const admin = createAdminClient();
    const { error: notifError } = await admin.from('notifications').insert({
      user_id: ride.created_by,
      type: 'waitlist_joined',
      title: notif.waitlistJoined.title(ride.title),
      body: notif.waitlistJoined.body,
      ride_id: rideId,
      channel: 'push',
    });
    if (notifError?.message) {
      console.error('Failed to create waitlist notification:', notifError.message);
    }
  }

  revalidatePath(`/rides/${rideId}`);
  revalidatePath('/rides');
  revalidatePath('/my-rides');
  revalidatePath('/notifications');
  revalidatePath('/');
  return { success: true, status: isFull ? 'waitlisted' : 'confirmed' };
}

/**
 * Cancel a ride signup.
 */
export async function cancelSignUp(rideId: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { error: common.notAuthenticated };
  }

  // Fetch ride for timing gate
  const { data: ride } = await supabase
    .from('rides')
    .select('ride_date, start_time, end_time, status, capacity, club:clubs(timezone)')
    .eq('id', rideId)
    .single();

  if (ride) {
    const tz = (ride.club as unknown as { timezone: string } | null)?.timezone ?? 'America/Toronto';
    const availability = getRideAvailability(ride, 0, tz);
    if (!availability.canCancel) {
      return { error: errors.cancellationClosed };
    }
  }

  // Check if the user being cancelled was confirmed (a spot opens up)
  const { data: currentSignup } = await supabase
    .from('ride_signups')
    .select('status')
    .eq('ride_id', rideId)
    .eq('user_id', user.id)
    .single();

  const wasConfirmed = currentSignup?.status === 'confirmed';

  const { error } = await supabase
    .from('ride_signups')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('ride_id', rideId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  // Auto-promote first waitlisted rider if a confirmed spot opened up
  if (wasConfirmed) {
    const { data: nextWaitlisted } = await supabase
      .from('ride_signups')
      .select('id, user_id')
      .eq('ride_id', rideId)
      .eq('status', 'waitlisted')
      .order('signed_up_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextWaitlisted) {
      // Promote to confirmed
      await supabase
        .from('ride_signups')
        .update({
          status: 'confirmed',
          waitlist_position: null,
        })
        .eq('id', nextWaitlisted.id);

      // Notify the promoted rider
      // Uses admin client — the canceling rider can't insert notifications for other users via RLS
      const { data: ride } = await supabase.from('rides').select('title').eq('id', rideId).single();

      if (ride) {
        const admin = createAdminClient();
        const { error: notifError } = await admin.from('notifications').insert({
          user_id: nextWaitlisted.user_id,
          type: 'waitlist_promoted',
          title: notif.waitlistPromoted.title(ride.title),
          body: notif.waitlistPromoted.body,
          ride_id: rideId,
          channel: 'push',
        });
        if (notifError?.message) {
          console.error('Failed to create waitlist promotion notification:', notifError.message);
        }
      }
    }
  }

  revalidatePath(`/rides/${rideId}`);
  revalidatePath('/rides');
  revalidatePath('/my-rides');
  revalidatePath('/notifications');
  revalidatePath('/');
  return { success: true };
}

export interface CreateRideData {
  club_id: string;
  title: string;
  description?: string;
  ride_date: string;
  start_time: string;
  end_time?: string;
  pace_group_id: string;
  distance_km?: number;
  elevation_m?: number;
  capacity: number;
  route_url: string;
  route_name?: string;
  route_polyline?: string;
  is_drop_ride: boolean;
  start_location_name?: string;
  start_location_address?: string;
  start_latitude?: number;
  start_longitude?: number;
  // Co-leaders to assign at creation
  co_leader_ids?: string[];
  // Recurring ride options
  recurring?: {
    recurrence: string;
    day_of_week: number;
    season_start_date?: string;
    season_end_date?: string;
    end_after_occurrences?: number;
    end_date?: string;
  };
}

/**
 * Create a new ride.
 */
export async function createRide(data: CreateRideData) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  // Fetch club settings once — used for date validation and recurring template creation
  const { data: club } = await supabase
    .from('clubs')
    .select('settings')
    .eq('id', data.club_id)
    .single();

  const settings = (club?.settings ?? {}) as Record<string, string>;

  // Validate start_time: must be on a 15-minute interval
  const [, startMinutes] = data.start_time.split(':').map(Number);
  if (isNaN(startMinutes) || startMinutes % 15 !== 0) {
    return { error: errors.timeIntervalInvalid };
  }

  // Validate ride_date: must not be in the past
  if (data.ride_date < todayDateString()) {
    return { error: errors.rideDateInPast };
  }

  // Validate ride_date: must fall within the club's active season (if configured)
  if (settings.season_start && data.ride_date < settings.season_start) {
    return { error: errors.rideDateOutsideSeason };
  }
  if (settings.season_end && data.ride_date > settings.season_end) {
    return { error: errors.rideDateOutsideSeason };
  }

  // If recurring, create the template first
  let templateId: string | null = null;
  if (data.recurring) {
    const { data: template, error: tplError } = await supabase
      .from('ride_templates')
      .insert({
        club_id: data.club_id,
        created_by: user.id,
        title: data.title,
        description: data.description || null,
        day_of_week: data.recurring.day_of_week,
        start_time: data.start_time,
        pace_group_id: data.pace_group_id || null,
        default_distance_km: data.distance_km ?? null,
        default_capacity: data.capacity ?? null,
        default_route_polyline: data.route_polyline || null,
        is_drop_ride: data.is_drop_ride,
        recurrence: data.recurring.recurrence,
        season_start_date: data.recurring.season_start_date || settings.season_start || null,
        season_end_date: data.recurring.season_end_date || settings.season_end || null,
        generate_weeks_ahead: 12,
        end_after_occurrences: data.recurring.end_after_occurrences ?? null,
        end_date: data.recurring.end_date || null,
        default_start_location_name: data.start_location_name || null,
        default_start_location_address: data.start_location_address || null,
        default_start_latitude: data.start_latitude ?? null,
        default_start_longitude: data.start_longitude ?? null,
      })
      .select('id')
      .single();

    if (tplError) return { error: tplError.message };
    templateId = template?.id ?? null;
  }

  // Estimate end_time from distance + pace group if not manually provided
  let endTime: string | null = data.end_time || null;
  if (!endTime && data.pace_group_id && data.distance_km) {
    const { data: pg } = await supabase
      .from('pace_groups')
      .select('moving_pace_min, moving_pace_max')
      .eq('id', data.pace_group_id)
      .single();
    if (pg) {
      endTime = estimateEndTime(data.distance_km, pg, data.start_time);
    }
  }

  // Insert ride
  const { data: ride, error: rideError } = await supabase
    .from('rides')
    .insert({
      club_id: data.club_id,
      created_by: user.id,
      title: data.title,
      description: data.description || null,
      ride_date: data.ride_date,
      start_time: data.start_time,
      end_time: endTime,
      pace_group_id: data.pace_group_id || null,
      distance_km: data.distance_km ?? null,
      elevation_m: data.elevation_m ?? null,
      capacity: data.capacity ?? null,
      route_url: data.route_url,
      route_name: data.route_name || null,
      route_polyline: data.route_polyline || null,
      is_drop_ride: data.is_drop_ride,
      status: 'scheduled',
      template_id: templateId,
      start_location_name: data.start_location_name || null,
      start_location_address: data.start_location_address || null,
      start_latitude: data.start_latitude ?? null,
      start_longitude: data.start_longitude ?? null,
    })
    .select('id')
    .single();

  if (rideError || !ride) {
    return { error: rideError?.message ?? errors.createRideFailed };
  }

  // Auto-enroll creator as rider #1
  const { error: signupError } = await supabase.from('ride_signups').insert({
    ride_id: ride.id,
    user_id: user.id,
    status: 'confirmed',
    signed_up_at: new Date().toISOString(),
  });

  if (signupError?.message) {
    console.error('Failed to auto-enroll ride creator:', signupError.message);
  }

  // Assign co-leaders and auto-enroll them as riders
  const coLeaderIds = data.co_leader_ids?.filter((id) => id !== user.id) ?? [];
  if (coLeaderIds.length > 0) {
    const { error: clError } = await supabase
      .from('ride_leaders')
      .insert(coLeaderIds.map((uid) => ({ ride_id: ride.id, user_id: uid })));
    if (clError?.message) {
      console.error('Failed to assign co-leaders:', clError.message);
    }

    const { error: clSignupError } = await supabase.from('ride_signups').insert(
      coLeaderIds.map((uid) => ({
        ride_id: ride.id,
        user_id: uid,
        status: 'confirmed' as const,
        signed_up_at: new Date().toISOString(),
      })),
    );
    if (clSignupError?.message) {
      console.error('Failed to auto-enroll co-leaders:', clSignupError.message);
    }
  }

  // Generate future recurring ride instances
  if (templateId) {
    try {
      const { generateRidesFromRecurring } = await import('@/lib/manage/actions');
      await generateRidesFromRecurring(templateId);
    } catch (e) {
      console.error('Failed to generate recurring rides:', e);
    }
  }

  // Notify all active club members about the new ride
  const { data: clubMembers } = await supabase
    .from('club_memberships')
    .select('user_id')
    .eq('club_id', data.club_id)
    .eq('status', 'active');

  if (clubMembers && clubMembers.length > 0) {
    const notifications = clubMembers
      .filter((m) => m.user_id !== user.id && !coLeaderIds.includes(m.user_id))
      .map((m) => ({
        user_id: m.user_id,
        type: 'ride_update',
        title: notif.newRidePosted.title(data.title),
        body: notif.newRidePosted.body,
        ride_id: ride.id,
        channel: 'push',
      }));

    if (notifications.length > 0) {
      const { error: notifError } = await supabase.from('notifications').insert(notifications);
      if (notifError?.message) {
        console.error('Failed to create new ride notifications:', notifError.message);
      }
    }
  }

  // Fetch weather for the new ride (errors swallowed internally by syncWeatherForRide)
  await syncWeatherForRide(ride.id);

  revalidatePath('/rides');
  revalidatePath('/manage');
  revalidatePath('/notifications');
  revalidatePath('/');
  return { success: true, rideId: ride.id };
}

export interface UpdateRideData {
  title: string;
  description?: string;
  ride_date: string;
  start_time: string;
  pace_group_id: string;
  distance_km?: number;
  elevation_m?: number;
  capacity: number;
  route_url: string;
  route_name?: string;
  route_polyline?: string;
  is_drop_ride: boolean;
  start_location_name?: string;
  start_location_address?: string;
  start_latitude?: number;
  start_longitude?: number;
  co_leader_ids?: string[];
}

/**
 * Update an existing ride.
 */
export async function updateRide(rideId: string, data: UpdateRideData) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  // Verify caller has permission to edit this ride
  const permissionError = await checkRideEditPermission(supabase, user.id, rideId);
  if (permissionError) return { error: permissionError };

  // Reject updates to cancelled rides
  const { data: existingRide } = await supabase
    .from('rides')
    .select('status')
    .eq('id', rideId)
    .single();

  if (existingRide?.status === RideStatus.CANCELLED) {
    return { error: ridesContent.detail.cancelledLocked };
  }

  // Validate start_time: must be on a 15-minute interval
  const [, updateMinutes] = data.start_time.split(':').map(Number);
  if (isNaN(updateMinutes) || updateMinutes % 15 !== 0) {
    return { error: errors.timeIntervalInvalid };
  }

  const { error: rideError } = await supabase
    .from('rides')
    .update({
      title: data.title,
      description: data.description || null,
      ride_date: data.ride_date,
      start_time: data.start_time,
      pace_group_id: data.pace_group_id || null,
      distance_km: data.distance_km ?? null,
      elevation_m: data.elevation_m ?? null,
      capacity: data.capacity ?? null,
      route_url: data.route_url,
      route_name: data.route_name || null,
      route_polyline: data.route_polyline || null,
      is_drop_ride: data.is_drop_ride,
      start_location_name: data.start_location_name || null,
      start_location_address: data.start_location_address || null,
      start_latitude: data.start_latitude ?? null,
      start_longitude: data.start_longitude ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rideId);

  if (rideError) return { error: rideError.message };

  // Sync co-leaders if provided
  if (data.co_leader_ids !== undefined) {
    // Remove all existing co-leaders
    await supabase.from('ride_leaders').delete().eq('ride_id', rideId);

    // Insert new co-leaders (excluding the current user)
    const newCoLeaders = data.co_leader_ids.filter((id) => id !== user.id);
    if (newCoLeaders.length > 0) {
      await supabase
        .from('ride_leaders')
        .insert(newCoLeaders.map((uid) => ({ ride_id: rideId, user_id: uid })));
    }
  }

  // Notify signed-up riders about the update
  const { data: signups } = await supabase
    .from('ride_signups')
    .select('user_id')
    .eq('ride_id', rideId)
    .in('status', ['confirmed', 'waitlisted']);

  if (signups && signups.length > 0) {
    const notifications = signups
      .filter((s) => s.user_id !== user.id)
      .map((s) => ({
        user_id: s.user_id,
        type: 'ride_update',
        title: notif.rideUpdated.title(data.title),
        body: notif.rideUpdated.body,
        ride_id: rideId,
        channel: 'push',
      }));

    if (notifications.length > 0) {
      const { error: notifError } = await supabase.from('notifications').insert(notifications);
      if (notifError?.message) {
        console.error('Failed to create ride update notifications:', notifError.message);
      }
    }
  }

  // Re-sync weather in case date/time/location changed (errors swallowed internally)
  await syncWeatherForRide(rideId);

  revalidatePath(`/rides/${rideId}`);
  revalidatePath('/rides');
  revalidatePath('/manage');
  revalidatePath('/notifications');
  revalidatePath('/');
  return { success: true };
}

/**
 * Update all future rides in a recurring series.
 * Updates the template AND all future unmodified instances.
 */
export async function updateRecurringSeries(rideId: string, data: UpdateRideData) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  // Verify caller has permission to edit this ride
  const permissionError = await checkRideEditPermission(supabase, user.id, rideId);
  if (permissionError) return { error: permissionError };

  // Get the current ride to find its template
  const { data: ride } = await supabase
    .from('rides')
    .select('template_id')
    .eq('id', rideId)
    .single();

  if (!ride?.template_id) {
    // No template — fall back to single ride update
    return updateRide(rideId, data);
  }

  const templateId = ride.template_id;
  const today = new Date().toISOString().split('T')[0];

  // Update the template
  await supabase
    .from('ride_templates')
    .update({
      title: data.title,
      description: data.description || null,
      start_time: data.start_time,
      pace_group_id: data.pace_group_id || null,
      default_distance_km: data.distance_km ?? null,
      default_capacity: data.capacity ?? null,
      default_route_polyline: data.route_polyline || null,
      is_drop_ride: data.is_drop_ride,
      default_start_location_name: data.start_location_name || null,
      default_start_location_address: data.start_location_address || null,
      default_start_latitude: data.start_latitude ?? null,
      default_start_longitude: data.start_longitude ?? null,
    })
    .eq('id', templateId);

  // Update all future scheduled instances from this template
  await supabase
    .from('rides')
    .update({
      title: data.title,
      description: data.description || null,
      start_time: data.start_time,
      pace_group_id: data.pace_group_id || null,
      distance_km: data.distance_km ?? null,
      capacity: data.capacity ?? null,
      route_polyline: data.route_polyline || null,
      is_drop_ride: data.is_drop_ride,
      start_location_name: data.start_location_name || null,
      start_location_address: data.start_location_address || null,
      start_latitude: data.start_latitude ?? null,
      start_longitude: data.start_longitude ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('template_id', templateId)
    .gte('ride_date', today)
    .eq('status', 'scheduled');

  revalidatePath('/rides');
  revalidatePath('/manage');
  revalidatePath('/');
  return { success: true };
}

/**
 * Cancel a ride. Creates notifications for signed-up riders.
 */
export async function cancelRide(rideId: string, reason: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  // Verify caller has permission to cancel this ride
  const permissionError = await checkRideEditPermission(supabase, user.id, rideId);
  if (permissionError) return { error: permissionError };

  // Get ride title for notification
  const { data: ride } = await supabase.from('rides').select('title').eq('id', rideId).single();

  // Update ride status
  const { error } = await supabase
    .from('rides')
    .update({
      status: RideStatus.CANCELLED,
      cancellation_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rideId);

  if (error) return { error: error.message };

  // Notify signed-up riders
  const { data: signups } = await supabase
    .from('ride_signups')
    .select('user_id')
    .eq('ride_id', rideId)
    .in('status', ['confirmed', 'waitlisted']);

  if (signups && signups.length > 0 && ride) {
    const notifications = signups.map((s) => ({
      user_id: s.user_id,
      type: 'ride_cancelled',
      title: notif.rideCancelled.title(ride.title),
      body: reason || notif.rideCancelled.defaultBody,
      ride_id: rideId,
      channel: 'both' as const,
    }));

    await supabase.from('notifications').insert(notifications);
  }

  // Cancel all active signups for this ride
  await supabase
    .from('ride_signups')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('ride_id', rideId)
    .in('status', ['confirmed', 'waitlisted']);

  revalidatePath(`/rides/${rideId}`);
  revalidatePath('/rides');
  revalidatePath('/manage');
  revalidatePath('/my-rides');
  revalidatePath('/notifications');
  revalidatePath('/');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

const COMMENT_MAX_LENGTH = 500;

/**
 * Validate comment body length and return the trimmed string.
 * Returns an error string if invalid, or the trimmed body if valid.
 */
function validateCommentBody(body: string): { trimmed: string } | { error: string } {
  const trimmed = body.trim();
  if (!trimmed) return { error: errors.commentEmpty };
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return { error: errors.commentTooLong(COMMENT_MAX_LENGTH) };
  }
  return { trimmed };
}

/**
 * Verify the caller can modify a comment (own comments, or any comment if admin).
 * Returns the comment data if allowed, or an error string if denied.
 */
async function checkCommentPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  commentId: string,
): Promise<{ comment: { ride_id: string; user_id: string } } | { error: string }> {
  const { data: comment } = await supabase
    .from('ride_comments')
    .select('ride_id, user_id')
    .eq('id', commentId)
    .single();

  if (!comment) return { error: errors.commentNotFound };

  if (comment.user_id !== userId) {
    const { data: membership } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (membership?.role !== 'admin') {
      return { error: errors.notAuthorized };
    }
  }

  return { comment };
}

/**
 * Add a comment to a ride.
 */
export async function addComment(rideId: string, body: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  const validation = validateCommentBody(body);
  if ('error' in validation) return { error: validation.error };

  const { error } = await supabase.from('ride_comments').insert({
    ride_id: rideId,
    user_id: user.id,
    body: validation.trimmed,
  });

  if (error) return { error: error.message };

  revalidatePath(`/rides/${rideId}`);
  return { success: true };
}

/**
 * Edit a comment (own comments only — RLS enforced).
 */
export async function editComment(commentId: string, body: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  const validation = validateCommentBody(body);
  if ('error' in validation) return { error: validation.error };

  const permission = await checkCommentPermission(supabase, user.id, commentId);
  if ('error' in permission) return { error: permission.error };

  const { error } = await supabase
    .from('ride_comments')
    .update({ body: validation.trimmed, updated_at: new Date().toISOString() })
    .eq('id', commentId);

  if (error) return { error: error.message };

  revalidatePath(`/rides/${permission.comment.ride_id}`);
  return { success: true };
}

/**
 * Delete a comment (own comments, or any comment if admin).
 */
export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  const permission = await checkCommentPermission(supabase, user.id, commentId);
  if ('error' in permission) return { error: permission.error };

  const { error } = await supabase.from('ride_comments').delete().eq('id', commentId);

  if (error) return { error: error.message };

  revalidatePath(`/rides/${permission.comment.ride_id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

/**
 * Toggle a reaction on a ride — adds if not present, removes if already reacted.
 */
export async function toggleRideReaction(rideId: string, reaction: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  // Check if the user already has this reaction
  const { data: existing } = await supabase
    .from('ride_reactions')
    .select('id')
    .eq('ride_id', rideId)
    .eq('user_id', user.id)
    .eq('reaction', reaction)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('ride_reactions').delete().eq('id', existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('ride_reactions')
      .insert({ ride_id: rideId, user_id: user.id, reaction });
    if (error) return { error: error.message };
  }

  revalidatePath(`/rides/${rideId}`);
  return { success: true, added: !existing };
}

/**
 * Toggle a reaction on a comment — adds if not present, removes if already reacted.
 */
export async function toggleCommentReaction(commentId: string, reaction: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  // Check if the user already has this reaction
  const { data: existing } = await supabase
    .from('comment_reactions')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .eq('reaction', reaction)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('comment_reactions').delete().eq('id', existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('comment_reactions')
      .insert({ comment_id: commentId, user_id: user.id, reaction });
    if (error) return { error: error.message };
  }

  // Find the ride_id from the comment to revalidate the correct path
  const { data: comment } = await supabase
    .from('ride_comments')
    .select('ride_id')
    .eq('id', commentId)
    .single();

  if (comment) revalidatePath(`/rides/${comment.ride_id}`);
  return { success: true, added: !existing };
}

// ---------------------------------------------------------------------------
// Co-Leaders
// ---------------------------------------------------------------------------

/**
 * Add a co-leader to a ride.
 * Only the ride creator or admin can add co-leaders.
 */
export async function addCoLeader(rideId: string, userId: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  const permissionError = await checkRideEditPermission(supabase, user.id, rideId);
  if (permissionError) return { error: permissionError };

  const { error } = await supabase
    .from('ride_leaders')
    .insert({ ride_id: rideId, user_id: userId });

  if (error) {
    if (error.code === '23505') return { error: errors.alreadyExists };
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Remove a co-leader from a ride.
 * Only the ride creator or admin can remove co-leaders.
 */
export async function removeCoLeader(rideId: string, userId: string) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  const permissionError = await checkRideEditPermission(supabase, user.id, rideId);
  if (permissionError) return { error: permissionError };

  const { error } = await supabase
    .from('ride_leaders')
    .delete()
    .eq('ride_id', rideId)
    .eq('user_id', userId);

  if (error) return { error: error.message };

  revalidatePath('/');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Leader Availability
// ---------------------------------------------------------------------------

export interface LeaderConflict {
  user_id: string;
  ride_title: string;
}

/**
 * Check which leaders have existing rides on a given date.
 * Returns conflicts for leaders who are signed up for a ride that day.
 */
export async function getLeaderRideConflicts(
  date: string,
  userIds: string[],
): Promise<LeaderConflict[]> {
  if (!date || userIds.length === 0) return [];

  const supabase = await createClient();
  const user = await getUser();
  if (!user) return [];

  // Find rides on this date where any of the given users are signed up
  const { data: signups } = await supabase
    .from('ride_signups')
    .select('user_id, ride:rides!inner(title, ride_date, status)')
    .in('user_id', userIds)
    .eq('ride.ride_date', date)
    .neq('ride.status', 'cancelled')
    .neq('status', 'cancelled');

  const conflicts: LeaderConflict[] = [];
  const seen = new Set<string>();

  for (const row of signups ?? []) {
    if (seen.has(row.user_id)) continue;
    seen.add(row.user_id);
    const ride = row.ride as unknown as { title: string };
    conflicts.push({ user_id: row.user_id, ride_title: ride?.title ?? '' });
  }

  return conflicts;
}

// ---------------------------------------------------------------------------
