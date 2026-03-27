'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { routes } from '@/config/routes';
import { appContent } from '@/content/app';

const { common, auth } = appContent;

/**
 * Client-side auth confirmation page.
 * Handles Supabase invite/magic link emails that use hash fragments (#access_token=...).
 * Supabase JS client automatically picks up tokens from the URL hash
 * via onAuthStateChange and sets the session.
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // The Supabase client automatically detects tokens in the URL hash
    // and triggers SIGNED_IN. We just need to listen for it.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        router.replace(routes.setupProfile);
      }
    });

    // Fallback: if no auth event fires within 5 seconds, show error
    const timeout = setTimeout(() => {
      setError(true);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">{common.error}</h2>
          <p className="mt-2 text-base text-muted-foreground">{auth.confirm.expiredLink}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-base text-muted-foreground">{common.loading}</p>
      </div>
    </div>
  );
}
