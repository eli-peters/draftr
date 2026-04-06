'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getUser } from '@/lib/supabase/server';
import { appContent } from '@/content/app';
import { toE164 } from '@/lib/phone';

const { common, errors, profile: profileContent } = appContent;

interface UpdateProfileData {
  bio?: string;
  preferred_pace_group?: string;
  phone_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

/**
 * Update the current user's profile.
 * Only updates fields that are explicitly provided — per-section editing
 * sends only the fields belonging to that section.
 */
export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  // Build the update payload from provided fields only
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if ('bio' in data) {
    updates.bio = data.bio || null;
  }
  if ('preferred_pace_group' in data) {
    updates.preferred_pace_group = data.preferred_pace_group || null;
  }
  if ('phone_number' in data) {
    let normalized = data.phone_number || null;
    if (normalized) {
      normalized = toE164(normalized);
      if (!normalized) return { error: profileContent.emergencyContact.phoneInvalidError };
    }
    updates.phone_number = normalized;
  }
  if ('emergency_contact_name' in data) {
    updates.emergency_contact_name = data.emergency_contact_name || null;
  }
  if ('emergency_contact_phone' in data) {
    let normalized = data.emergency_contact_phone || null;
    if (normalized) {
      normalized = toE164(normalized);
      if (!normalized) return { error: profileContent.emergencyContact.phoneInvalidError };
    }
    updates.emergency_contact_phone = normalized;
  }
  if ('emergency_contact_relationship' in data) {
    updates.emergency_contact_relationship = data.emergency_contact_relationship || null;
  }

  const { error } = await supabase.from('users').update(updates).eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/profile');
  revalidatePath('/');
  return { success: true };
}

/**
 * Toggle push notification preference.
 */
export async function updateNotificationPreference(pushEnabled: boolean) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return { error: common.notAuthenticated };

  // Fetch current preferences to preserve other fields
  const { data: current } = await supabase
    .from('users')
    .select('notification_preferences')
    .eq('id', user.id)
    .single();

  const prefs = (current?.notification_preferences as Record<string, unknown>) ?? {};

  const { error } = await supabase
    .from('users')
    .update({
      notification_preferences: { ...prefs, push: pushEnabled },
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Upload an avatar image and update the user's avatar_url.
 */
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();

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
  const user = await getUser();

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
