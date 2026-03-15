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

  // Get ride to check capacity
  const { data: ride } = await supabase
    .from("rides")
    .select("id, capacity, status")
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

  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/rides");
  return { success: true, status: isFull ? "waitlisted" : "confirmed" };
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
  return { success: true };
}
