/**
 * Theme type definitions.
 *
 * Layer 1: Brand primitives — raw colour values. The app ships a default set;
 *          clubs can selectively override specific primitives.
 * Layer 2: Semantic tokens — what components actually use (mapped from primitives
 *          via color-mix() in globals.css).
 */

export interface BrandPrimitives {
  /** Primary brand colour (CTAs, links, active states) */
  primary: string;
  /** Secondary/danger colour (warnings, destructive actions) */
  danger: string;
  /** Tertiary accent (subtle accents, hover states) */
  accent: string;
  /** Near-black for text and dark backgrounds */
  black: string;
  /** White for light backgrounds and text on dark */
  white: string;
  /** Muted grey for secondary text, borders, disabled states */
  muted: string;
}

/** User's color mode preference */
export type ColorMode = 'system' | 'light' | 'dark';

/** Fully resolved theme (app default or app default + club overrides merged) */
export interface ClubTheme {
  /** Unique identifier (matches clubs.slug in DB, or "draftr" for default) */
  slug: string;
  /** Display name */
  name: string;
  /** Brand primitive colours (complete set) */
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
