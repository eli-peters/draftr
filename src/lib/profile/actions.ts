"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  preferred_pace_group?: string;
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("users")
    .update({
      display_name: data.display_name || null,
      bio: data.bio || null,
      preferred_pace_group: data.preferred_pace_group || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true };
}
