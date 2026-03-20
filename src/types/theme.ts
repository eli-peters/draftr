/**
 * Theme type definitions.
 *
 * Layer 1: Brand primitives — seed colours for each colour family.
 *          The app ships a default set (Draftr magenta + teal); clubs can
 *          selectively override specific seeds.
 * Layer 2: Semantic tokens — what components actually use (mapped from
 *          primitive ramps in globals.css via generated tokens.css).
 */

export interface BrandPrimitives {
  /** Primary brand colour — maps to --color-primary-500 (CTAs, links, active states) */
  primary: string;
  /** Secondary brand colour — maps to --color-secondary-500 (supporting actions, badges) */
  secondary: string;
  /** Neutral base — maps to --color-neutral-500 (text, backgrounds, borders). Optional — defaults to warm slate. */
  neutral?: string;
  /** Error/danger base — maps to --color-error-500 (destructive actions). Optional — defaults to system red. */
  danger?: string;
}

/** User's color mode preference */
export type ColorMode = 'system' | 'light' | 'dark';

/** Fully resolved theme (app default or app default + club overrides merged) */
export interface ClubTheme {
  /** Unique identifier (matches clubs.slug in DB, or "draftr" for default) */
  slug: string;
  /** Display name */
  name: string;
  /** Brand primitive colours (complete set of required seeds) */
  colors: BrandPrimitives;
  /** Club logo URL (optional — may come from DB) */
  logoUrl?: string;
  /** Club website (optional) */
  websiteUrl?: string;
}

/** Club-specific overrides — only the primitives that differ from the app default */
export interface ClubOverride {
  slug: string;
  name: string;
  /** Partial brand overrides — unspecified tokens fall back to app default */
  colors: Partial<BrandPrimitives>;
  logoUrl?: string;
  websiteUrl?: string;
}
