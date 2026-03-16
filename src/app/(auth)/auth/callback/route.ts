import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const next = searchParams.get("next") ?? "/setup-profile";

  const supabase = await createClient();

  // PKCE flow: exchange code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Token hash flow (invite, recovery, etc.)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If we get here, auth failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
