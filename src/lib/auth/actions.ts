"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
 * Uses the service role client to call auth.admin.inviteUserByEmail().
 */
export async function inviteMember(formData: FormData) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();

  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "rider";
  const clubId = formData.get("club_id") as string;

  // Check if this email has already been invited
  const { data: existingUser } = await adminSupabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return { error: "already_invited" };
  }

  // Build the redirect URL for the invite email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectTo = `${siteUrl}/auth/callback?next=/setup-profile`;

  // Invite the user via Supabase Auth (sends email with magic link)
  const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(
    email,
    { redirectTo },
  );

  if (error) {
    if (error.message.toLowerCase().includes("rate limit")) {
      return { error: "rate_limited" };
    }
    return { error: error.message };
  }

  // Pre-create user row + club membership so the role is ready when they sign up
  if (data.user) {
    // Create a stub users row (profile setup will upsert with full details later)
    await adminSupabase.from("users").upsert(
      {
        id: data.user.id,
        email,
        full_name: email.split("@")[0],
        onboarding_completed: false,
      },
      { onConflict: "id" },
    );

    const { error: membershipError } = await adminSupabase
      .from("club_memberships")
      .upsert(
        {
          club_id: clubId,
          user_id: data.user.id,
          role,
          status: "pending",
        },
        { onConflict: "club_id,user_id" },
      );

    if (membershipError) {
      return { error: membershipError.message };
    }
  }

  revalidatePath("/manage");
  return { success: true };
}
