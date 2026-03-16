"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign up for a ride. Handles capacity and waitlisting.
 */
export async function signUpForRide(rideId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get ride to check capacity (+ title for notification)
  const { data: ride } = await supabase
    .from("rides")
    .select("id, title, capacity, status")
    .eq("id", rideId)
    .single();

  if (!ride) {
    return { error: "Ride not found" };
  }

  if (ride.status === "cancelled") {
    return { error: "This ride has been cancelled" };
  }

  // Count current confirmed signups
  const { count } = await supabase
    .from("ride_signups")
    .select("*", { count: "exact", head: true })
    .eq("ride_id", rideId)
    .eq("status", "confirmed");

  const currentCount = count ?? 0;
  const isFull = ride.capacity != null && currentCount >= ride.capacity;

  const { error } = await supabase.from("ride_signups").upsert(
    {
      ride_id: rideId,
      user_id: user.id,
      status: isFull ? "waitlisted" : "confirmed",
      waitlist_position: isFull ? currentCount - ride.capacity! + 1 : null,
      signed_up_at: new Date().toISOString(),
      cancelled_at: null,
    },
    { onConflict: "ride_id,user_id" },
  );

  if (error) {
    return { error: error.message };
  }

  // Create notification for the rider
  const signupStatus = isFull ? "waitlisted" : "confirmed";
  if (signupStatus === "confirmed") {
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "signup_confirmed",
      title: `You're signed up for ${ride.title}`,
      body: null,
      ride_id: rideId,
      channel: "push",
    });
  }

  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/rides");
  revalidatePath("/my-rides");
  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true, status: signupStatus };
}

/**
 * Cancel a ride signup.
 */
export async function cancelSignUp(rideId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("ride_signups")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("ride_id", rideId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/rides");
  revalidatePath("/my-rides");
  revalidatePath("/");
  return { success: true };
}

export interface CreateRideData {
  club_id: string;
  title: string;
  description?: string;
  ride_date: string;
  start_time: string;
  meeting_location_id?: string;
  pace_group_id?: string;
  distance_km?: number;
  elevation_m?: number;
  capacity?: number;
  route_url?: string;
  route_name?: string;
  is_drop_ride: boolean;
  organiser_notes?: string;
  tag_ids: string[];
}

/**
 * Create a new ride. Inserts ride + ride_tags.
 */
export async function createRide(data: CreateRideData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Insert ride
  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .insert({
      club_id: data.club_id,
      created_by: user.id,
      title: data.title,
      description: data.description || null,
      ride_date: data.ride_date,
      start_time: data.start_time,
      meeting_location_id: data.meeting_location_id || null,
      pace_group_id: data.pace_group_id || null,
      distance_km: data.distance_km ?? null,
      elevation_m: data.elevation_m ?? null,
      capacity: data.capacity ?? null,
      route_url: data.route_url || null,
      route_name: data.route_name || null,
      is_drop_ride: data.is_drop_ride,
      organiser_notes: data.organiser_notes || null,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (rideError || !ride) {
    return { error: rideError?.message ?? "Failed to create ride" };
  }

  // Insert tags
  if (data.tag_ids.length > 0) {
    const tagRows = data.tag_ids.map((tag_id) => ({
      ride_id: ride.id,
      tag_id,
    }));

    const { error: tagError } = await supabase
      .from("ride_tags")
      .insert(tagRows);

    if (tagError) {
      console.error("Error inserting ride tags:", tagError);
    }
  }

  revalidatePath("/rides");
  revalidatePath("/manage");
  revalidatePath("/");
  return { success: true, rideId: ride.id };
}

export interface UpdateRideData {
  title: string;
  description?: string;
  ride_date: string;
  start_time: string;
  meeting_location_id?: string;
  pace_group_id?: string;
  distance_km?: number;
  elevation_m?: number;
  capacity?: number;
  route_url?: string;
  route_name?: string;
  is_drop_ride: boolean;
  organiser_notes?: string;
  tag_ids: string[];
}

/**
 * Update an existing ride. Replaces ride_tags.
 */
export async function updateRide(rideId: string, data: UpdateRideData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error: rideError } = await supabase
    .from("rides")
    .update({
      title: data.title,
      description: data.description || null,
      ride_date: data.ride_date,
      start_time: data.start_time,
      meeting_location_id: data.meeting_location_id || null,
      pace_group_id: data.pace_group_id || null,
      distance_km: data.distance_km ?? null,
      elevation_m: data.elevation_m ?? null,
      capacity: data.capacity ?? null,
      route_url: data.route_url || null,
      route_name: data.route_name || null,
      is_drop_ride: data.is_drop_ride,
      organiser_notes: data.organiser_notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rideId);

  if (rideError) return { error: rideError.message };

  // Replace tags: delete all then re-insert
  await supabase.from("ride_tags").delete().eq("ride_id", rideId);

  if (data.tag_ids.length > 0) {
    await supabase.from("ride_tags").insert(
      data.tag_ids.map((tag_id) => ({ ride_id: rideId, tag_id })),
    );
  }

  // Notify signed-up riders about the update
  const { data: signups } = await supabase
    .from("ride_signups")
    .select("user_id")
    .eq("ride_id", rideId)
    .in("status", ["confirmed", "waitlisted"]);

  if (signups && signups.length > 0) {
    const notifications = signups
      .filter((s) => s.user_id !== user.id) // Don't notify the leader who made the edit
      .map((s) => ({
        user_id: s.user_id,
        type: "ride_update",
        title: `Ride Updated: ${data.title}`,
        body: "The ride details have been updated. Tap to see changes.",
        ride_id: rideId,
        channel: "push",
      }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }
  }

  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/rides");
  revalidatePath("/manage");
  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true };
}

/**
 * Cancel a ride. Creates notifications for signed-up riders.
 */
export async function cancelRide(rideId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Get ride title for notification
  const { data: ride } = await supabase
    .from("rides")
    .select("title")
    .eq("id", rideId)
    .single();

  // Update ride status
  const { error } = await supabase
    .from("rides")
    .update({
      status: "cancelled",
      cancellation_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rideId);

  if (error) return { error: error.message };

  // Notify signed-up riders
  const { data: signups } = await supabase
    .from("ride_signups")
    .select("user_id")
    .eq("ride_id", rideId)
    .in("status", ["confirmed", "waitlisted"]);

  if (signups && signups.length > 0 && ride) {
    const notifications = signups.map((s) => ({
      user_id: s.user_id,
      type: "ride_cancelled",
      title: `Ride Cancelled: ${ride.title}`,
      body: reason || "This ride has been cancelled by the organiser.",
      ride_id: rideId,
      channel: "push",
    }));

    await supabase.from("notifications").insert(notifications);
  }

  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/rides");
  revalidatePath("/manage");
  revalidatePath("/my-rides");
  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true };
}
