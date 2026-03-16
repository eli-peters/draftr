import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth confirmation route handler.
 * Handles Supabase email template links: /auth/confirm?token_hash=...&type=invite
 * Exchanges the token for a session and redirects to profile setup.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/setup-profile";

  const supabase = await createClient();

  // PKCE flow: exchange code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Token hash flow (invite, recovery, email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to sign-in
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
