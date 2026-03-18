"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { appContent } from "@/content/app";

const { common, errors } = appContent;

interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  preferred_pace_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: common.notAuthenticated };

  const { error } = await supabase
    .from("users")
    .update({
      display_name: data.display_name || null,
      bio: data.bio || null,
      preferred_pace_group: data.preferred_pace_group || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true };
}

/**
 * Upload an avatar image and update the user's avatar_url.
 */
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: common.notAuthenticated };

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) return { error: errors.noFileProvided };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filePath = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // Append cache-busting timestamp so the browser picks up the new image
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true, avatarUrl };
}
