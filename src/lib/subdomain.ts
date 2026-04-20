import { type NextRequest } from 'next/server';

/**
 * Root domains the app runs on. The subdomain is whatever precedes these.
 * Order matters — check longer suffixes first to avoid partial matches.
 */
const ROOT_DOMAINS = ['draftr.app', 'lvh.me', 'vercel.app', 'localhost'];

/** Reserved subdomain that serves the authenticated app. */
export const APP_SUBDOMAIN = 'go';

/** Subdomains treated as equivalent to root domain (marketing). */
const MARKETING_SUBDOMAINS = new Set(['www']);

/** Request header carrying the resolved subdomain (set by middleware). */
export const HEADER_SUBDOMAIN = 'x-draftr-subdomain';

/** Request header carrying the club slug for club subdomains (set by middleware). */
export const HEADER_CLUB_SLUG = 'x-draftr-club-slug';

export interface SubdomainContext {
  /** Raw subdomain string, or null for root domain. */
  subdomain: string | null;
  /** True when subdomain is 'go' (the main app). */
  isApp: boolean;
  /** True when a non-reserved subdomain is present (future club routing). */
  isClub: boolean;
  /** The club slug if isClub, otherwise null. */
  clubSlug: string | null;
}

/**
 * Extract the subdomain from a host string.
 *
 * Examples:
 *   'go.draftr.app'          → 'go'
 *   'dhf.draftr.app'         → 'dhf'
 *   'draftr.app'             → null
 *   'go.lvh.me:3000'         → 'go'
 *   'lvh.me:3000'            → null
 *   'localhost:3000'          → null  (treated as app in middleware)
 */
export function resolveSubdomain(host: string): SubdomainContext {
  // Strip port
  const hostname = host.split(':')[0];

  let subdomain: string | null = null;

  for (const root of ROOT_DOMAINS) {
    if (hostname === root) {
      // Exact match — no subdomain
      subdomain = null;
      break;
    }

    if (hostname.endsWith(`.${root}`)) {
      subdomain = hostname.slice(0, -(root.length + 1));
      break;
    }
  }

  // Treat www (and any other marketing subdomains) as root domain
  if (subdomain && MARKETING_SUBDOMAINS.has(subdomain)) {
    subdomain = null;
  }

  const isApp = subdomain === APP_SUBDOMAIN;
  const isClub = subdomain !== null && !isApp;

  return {
    subdomain,
    isApp,
    isClub,
    clubSlug: isClub ? subdomain : null,
  };
}

/**
 * Get the root domain from a request (e.g. 'draftr.app' or 'lvh.me').
 * Used to build cross-subdomain redirect URLs.
 */
export function getRootDomain(request: NextRequest): string {
  const hostname = request.headers.get('host')?.split(':')[0] ?? 'localhost';

  for (const root of ROOT_DOMAINS) {
    if (hostname === root || hostname.endsWith(`.${root}`)) {
      return root;
    }
  }

  return hostname;
}

/**
 * Get the port suffix from the request host, if any.
 * Returns ':3000' or '' (empty string for standard ports).
 */
export function getPortSuffix(request: NextRequest): string {
  const host = request.headers.get('host') ?? '';
  const colonIndex = host.lastIndexOf(':');
  if (colonIndex === -1) return '';

  const port = host.slice(colonIndex + 1);
  if (port === '80' || port === '443') return '';
  return `:${port}`;
}
