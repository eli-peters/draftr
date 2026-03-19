'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { appContent } from '@/content/app';
import { toE164 } from '@/lib/phone';

const { common, errors, profile: profileContent } = appContent;

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: common.notAuthenticated };

  let normalizedPhone = data.emergency_contact_phone || null;
  if (normalizedPhone) {
    normalizedPhone = toE164(normalizedPhone);
    if (!normalizedPhone) return { error: profileContent.emergencyContact.phoneInvalidError };
  }

  const { error } = await supabase
    .from('users')
    .update({
      display_name: data.display_name || null,
      bio: data.bio || null,
      preferred_pace_group: data.preferred_pace_group || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: normalizedPhone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/profile');
  revalidatePath('/');
  return { success: true };
}

/**
 * Upload an avatar image and update the user's avatar_url.
 */
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: common.notAuthenticated };

  const file = formData.get('avatar') as File;
  if (!file || file.size === 0) return { error: errors.noFileProvided };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filePath = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

  // Append cache-busting timestamp so the browser picks up the new image
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath('/profile');
  revalidatePath('/');
  return { success: true, avatarUrl };
}

/**
 * Remove the current user's avatar and revert to initials.
 */
export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: common.notAuthenticated };

  // List all files in the user's avatar folder to find the exact filename
  const { data: files, error: listError } = await supabase.storage.from('avatars').list(user.id);

  if (listError) return { error: listError.message };

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${user.id}/${f.name}`);
    const { error: deleteError } = await supabase.storage.from('avatars').remove(filePaths);

    if (deleteError) return { error: deleteError.message };
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath('/profile');
  revalidatePath('/');
  return { success: true };
}
