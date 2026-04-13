import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';

/**
 * Request-scoped Supabase client for Server Components, Server Actions, and Route Handlers.
 * Wrapped in React.cache() so all callers within a single request share one instance.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();
  const cookieDomain = getCookieDomain();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              }),
            );
          } catch {
            // setAll is called from Server Components where cookies can't be set.
            // This can be ignored if middleware is refreshing sessions.
          }
        },
      },
    },
  );
});

/**
 * Request-scoped auth user. Calls auth.getUser() once per request via React.cache().
 * Middleware already refreshes the session — this avoids redundant network round-trips.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
