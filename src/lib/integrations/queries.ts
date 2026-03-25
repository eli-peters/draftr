import { createClient } from '@/lib/supabase/server';
import type { IntegrationService } from '@/types/database';

/**
 * Safe connection info — never includes tokens.
 */
export interface ConnectionInfo {
  service: IntegrationService;
  external_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  connected_at: string;
}

/**
 * Fetch all connected services for a user.
 * Returns safe subset only (no tokens).
 */
export async function getUserConnections(userId: string): Promise<ConnectionInfo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_connections')
    .select('service, external_user_id, profile_data, connected_at')
    .eq('user_id', userId)
    .order('connected_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    service: row.service as IntegrationService,
    external_user_id: row.external_user_id,
    display_name: extractDisplayName(row.service, row.profile_data),
    avatar_url: extractAvatarUrl(row.service, row.profile_data),
    connected_at: row.connected_at,
  }));
}

/**
 * Fetch a single connection for a user + service.
 * Returns null if not connected.
 */
export async function getUserConnection(
  userId: string,
  service: IntegrationService,
): Promise<ConnectionInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_connections')
    .select('service, external_user_id, profile_data, connected_at')
    .eq('user_id', userId)
    .eq('service', service)
    .single();

  if (error || !data) return null;

  return {
    service: data.service as IntegrationService,
    external_user_id: data.external_user_id,
    display_name: extractDisplayName(data.service, data.profile_data),
    avatar_url: extractAvatarUrl(data.service, data.profile_data),
    connected_at: data.connected_at,
  };
}

// ---------------------------------------------------------------------------
// Helpers — extract display info from service-specific profile_data JSONB
// ---------------------------------------------------------------------------

function extractDisplayName(
  service: string,
  profileData: Record<string, unknown> | null,
): string | null {
  if (!profileData) return null;

  switch (service) {
    case 'strava': {
      const first = profileData.firstname as string | undefined;
      const last = profileData.lastname as string | undefined;
      return [first, last].filter(Boolean).join(' ') || null;
    }
    case 'ridewithgps': {
      return (profileData.name as string) ?? null;
    }
    default:
      return null;
  }
}

function extractAvatarUrl(
  service: string,
  profileData: Record<string, unknown> | null,
): string | null {
  if (!profileData) return null;

  switch (service) {
    case 'strava':
      return (profileData.profile as string) ?? null;
    case 'ridewithgps':
      return (profileData.avatar_url as string) ?? null;
    default:
      return null;
  }
}
