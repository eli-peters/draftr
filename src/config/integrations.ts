import { StravaIcon, RwgpsIcon } from '@/components/icons/service-icons';
import type { IntegrationService } from '@/types/database';

export interface IntegrationConfig {
  service: IntegrationService;
  displayName: string;
  authorizeUrl: string;
  tokenUrl: string;
  deauthorizeUrl: string | null;
  apiBase: string;
  scopes: string;
  callbackPath: string;
  /** Environment variable name for the OAuth client ID */
  clientIdEnvKey: string;
  /** Environment variable name for the OAuth client secret */
  clientSecretEnvKey: string;
  /** Brand colour for UI (hex) */
  brandColor: string;
}

export const integrations: Record<string, IntegrationConfig> = {
  strava: {
    service: 'strava',
    displayName: 'Strava',
    authorizeUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    deauthorizeUrl: 'https://www.strava.com/oauth/deauthorize',
    apiBase: 'https://www.strava.com/api/v3',
    scopes: 'read,activity:read_all',
    callbackPath: '/api/integrations/strava/callback',
    clientIdEnvKey: 'STRAVA_CLIENT_ID',
    clientSecretEnvKey: 'STRAVA_CLIENT_SECRET',
    brandColor: '#FC5200',
  },
  ridewithgps: {
    service: 'ridewithgps',
    displayName: 'Ride with GPS',
    authorizeUrl: 'https://ridewithgps.com/oauth/authorize',
    tokenUrl: 'https://ridewithgps.com/oauth/token.json',
    deauthorizeUrl: 'https://ridewithgps.com/oauth/revoke.json',
    apiBase: 'https://ridewithgps.com/api/v1',
    scopes: 'user',
    callbackPath: '/api/integrations/ridewithgps/callback',
    clientIdEnvKey: 'RWGPS_CLIENT_ID',
    clientSecretEnvKey: 'RWGPS_CLIENT_SECRET',
    brandColor: '#FA6400',
  },
} as const;

/** Icon components for each integration service */
export const serviceIcons: Record<
  IntegrationService,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  strava: StravaIcon,
  ridewithgps: RwgpsIcon,
};

/** Display labels for each integration service (derived from config) */
export const serviceLabels: Record<IntegrationService, string> = Object.fromEntries(
  Object.values(integrations).map((c) => [c.service, c.displayName]),
) as Record<IntegrationService, string>;

/** Refresh tokens this many seconds before actual expiry */
export const TOKEN_REFRESH_BUFFER_SECONDS = 300;

/** Cookie name for CSRF state during OAuth flow */
export const OAUTH_STATE_COOKIE = 'oauth_state';

/** Max age for the OAuth state cookie (seconds) */
export const OAUTH_STATE_MAX_AGE = 300;
