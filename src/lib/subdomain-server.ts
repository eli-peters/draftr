import { headers } from 'next/headers';
import {
  APP_SUBDOMAIN,
  HEADER_SUBDOMAIN,
  HEADER_CLUB_SLUG,
  type SubdomainContext,
} from '@/lib/subdomain';

/**
 * Read the subdomain context set by middleware in server components / layouts.
 * Returns the same shape as resolveSubdomain() but reads from request headers.
 */
export async function getSubdomainContext(): Promise<SubdomainContext> {
  const h = await headers();
  const subdomain = h.get(HEADER_SUBDOMAIN) || null;
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
 * Shorthand — returns the club slug if the request is on a club subdomain, otherwise null.
 */
export async function getClubSlug(): Promise<string | null> {
  const h = await headers();
  return h.get(HEADER_CLUB_SLUG) || null;
}
