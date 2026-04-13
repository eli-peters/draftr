import { createBrowserClient } from '@supabase/ssr';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';

/**
 * Supabase client for use in Client Components.
 * Uses environment variables — never hardcoded.
 */
export function createClient() {
  const cookieDomain = getCookieDomain();

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : {},
  );
}
