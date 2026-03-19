import type { ClubOverride, ClubTheme } from '@/types/theme';
import { defaultTheme } from './default';

/**
 * Resolve a club override into a full theme by merging onto the app default.
 * Unspecified brand primitives fall back to the default.
 */
export function resolveClubTheme(override: ClubOverride): ClubTheme {
  return {
    slug: override.slug,
    name: override.name,
    colors: { ...defaultTheme.colors, ...override.colors },
    logoUrl: override.logoUrl,
    websiteUrl: override.websiteUrl,
  };
}

/**
 * Registry of club overrides.
 * Import club files here as they onboard.
 */
const clubOverrides: Record<string, ClubOverride> = {
  // Example:
  // [someClub.slug]: someClub,
};

/**
 * Get a resolved theme by club slug. Falls back to app default.
 */
export function getTheme(slug?: string): ClubTheme {
  if (slug && clubOverrides[slug]) {
    return resolveClubTheme(clubOverrides[slug]);
  }
  return defaultTheme;
}

export { defaultTheme };
