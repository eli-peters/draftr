'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, getUser } from '@/lib/supabase/server';
import { appContent } from '@/content/app';

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return { error: appContent.errors.signInFailed };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: error?.message ?? appContent.errors.signInFailed };
  }

  // Check onboarding + membership status in parallel
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from('users').select('onboarding_completed').eq('id', data.user.id).single(),
    // RLS only allows active members to read club_memberships, so if this returns null
    // after onboarding is complete, the user's membership is inactive or doesn't exist.
    supabase
      .from('club_memberships')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  if (!profile || !profile.onboarding_completed) {
    redirect('/setup-profile');
  }

  if (!membership) {
    await supabase.auth.signOut();
    return { error: appContent.errors.accountDeactivated };
  }

  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/sign-in');
}

/**
 * Send a password reset email to the currently signed-in user.
 * Uses Supabase's built-in password recovery flow — the email links back to
 * /auth/callback with a recovery token.
 */
export async function sendPasswordResetEmail() {
  const supabase = await createClient();
  const user = await getUser();

  if (!user?.email) {
    return { error: appContent.common.notAuthenticated };
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`,
  });

  if (error) return { error: error.message };

  return { success: true };
}

export async function setupProfile(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const password = formData.get('password') as string;
  const fullName = (formData.get('full_name') as string).trim();

  // Require at least a first and last name
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  if (nameParts.length < 2) {
    return { error: appContent.errors.fullNameRequired };
  }
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  const bio = formData.get('bio') as string;
  const preferredPace = formData.get('preferred_pace_group') as string;

  // Use admin client for profile upsert to bypass RLS and guarantee it works
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.from('users').upsert({
    id: user.id,
    email: user.email!,
    first_name: firstName,
    last_name: lastName,
    bio: bio || null,
    preferred_pace_group: preferredPace || null,
    onboarding_completed: true,
  });

  if (error) {
    return { error: error.message };
  }

  // Set password AFTER profile is saved — updateUser may change session tokens
  if (password) {
    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      return { error: pwError.message };
    }
  }

  // Activate any pending club memberships now that onboarding is complete
  await adminSupabase
    .from('club_memberships')
    .update({ status: 'active' })
    .eq('user_id', user.id)
    .eq('status', 'pending');

  redirect('/');
}

/**
 * Admin action: invite a new member by email.
 * Uses the service role client to call auth.admin.inviteUserByEmail().
 */
export async function inviteMember(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { error: appContent.common.notAuthenticated };

  const email = formData.get('email') as string;
  const role = (formData.get('role') as string) || 'rider';
  const clubId = formData.get('club_id') as string;

  if (!email || !clubId) return { error: appContent.errors.notAuthorized };

  // Verify caller is an admin for this club
  const { data: callerMembership } = await supabase
    .from('club_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('club_id', clubId)
    .eq('status', 'active')
    .single();

  if (callerMembership?.role !== 'admin') {
    return { error: appContent.errors.notAuthorized };
  }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // Check if this email has already been invited
  const { data: existingUser } = await adminSupabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    return { error: 'already_invited' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Generate invite link without sending email (avoids Supabase free-tier rate limits)
  const { data, error } = await adminSupabase.auth.admin.generateLink({
    type: 'invite',
    email,
  });

  if (error) {
    if (error.message.toLowerCase().includes('rate limit')) {
      return { error: 'rate_limited' };
    }
    return { error: error.message };
  }

  // Pre-create user row + club membership so the role is ready when they sign up
  if (data.user) {
    // Create a stub users row (profile setup will upsert with full details later)
    await adminSupabase.from('users').upsert(
      {
        id: data.user.id,
        email,
        first_name: email.split('@')[0],
        last_name: '',
        onboarding_completed: false,
      },
      { onConflict: 'id' },
    );

    const { error: membershipError } = await adminSupabase.from('club_memberships').upsert(
      {
        club_id: clubId,
        user_id: data.user.id,
        role,
        status: 'pending',
      },
      { onConflict: 'club_id,user_id' },
    );

    if (membershipError) {
      return { error: membershipError.message };
    }
  }

  revalidatePath('/manage');

  // Build our own invite URL using the hashed_token from generateLink.
  // This goes directly to our /auth/callback route which verifies server-side via verifyOtp.
  // Bypasses Supabase's verify endpoint (which redirects with hash fragments that server routes can't read).
  const hashedToken = data.properties?.hashed_token;
  if (!hashedToken) {
    return { error: 'Failed to generate invite link' };
  }

  const inviteLink = `${siteUrl}/auth/callback?token_hash=${hashedToken}&type=invite`;
  return { success: true, inviteLink };
}
