"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed")
    .single();

  if (!profile || !profile.onboarding_completed) {
    redirect("/setup-profile");
  }

  redirect("/rides");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function setupProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const fullName = formData.get("full_name") as string;
  const displayName = formData.get("display_name") as string;
  const bio = formData.get("bio") as string;
  const preferredPace = formData.get("preferred_pace_group") as string;

  const { error } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email!,
    full_name: fullName,
    display_name: displayName || null,
    bio: bio || null,
    preferred_pace_group: preferredPace || null,
    onboarding_completed: true,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/rides");
}

/**
 * Admin action: invite a new member by email.
 * Creates a Supabase auth user and sends them an invite link.
 */
export async function inviteMember(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "rider";
  const clubId = formData.get("club_id") as string;

  // Invite the user via Supabase Auth (sends email with magic link)
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);

  if (error) {
    return { error: error.message };
  }

  // Pre-create the club membership so the role is ready when they sign up
  if (data.user) {
    const { error: membershipError } = await supabase
      .from("club_memberships")
      .insert({
        club_id: clubId,
        user_id: data.user.id,
        role,
        status: "pending",
      });

    if (membershipError) {
      return { error: membershipError.message };
    }
  }

  return { success: true };
}
