import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Auth callback route handler.
 * Handles server-side auth flows (PKCE code exchange, token_hash verification).
 * For implicit flow (hash fragments), see the client-side handler at /auth/confirm/page.tsx.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();
  let user: User | null = null;

  // PKCE flow: exchange code for session
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) user = data.user;
  }

  // Token hash flow (invite, recovery, etc.)
  if (!user && token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email",
    });
    if (!error) user = data.user;
  }

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      return NextResponse.redirect(`${origin}/`);
    }

    return NextResponse.redirect(`${origin}/setup-profile`);
  }

  // If we get here, auth failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
