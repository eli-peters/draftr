import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Module-scoped singleton — reuses a single HTTP connection across all queries.
 */
let adminClient: SupabaseClient | null = null;

/**
 * Admin Supabase client using the service role key.
 * Bypasses RLS — use ONLY for admin operations like inviting users.
 * Never expose this client to the browser.
 *
 * Returns a singleton instance to avoid creating fresh TCP/TLS connections
 * on every call (the admin client is stateless — no per-request cookies).
 */
export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
