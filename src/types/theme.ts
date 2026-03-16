/**
 * Theme type definitions for multi-club theming.
 *
 * Layer 1: Brand primitives — raw colour values specific to a club.
 * Layer 2: Semantic tokens — what the app actually uses (mapped from primitives).
 *
 * Switching clubs = providing a different ClubTheme object.
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
export type ColorMode = "system" | "light" | "dark";

export interface ClubTheme {
  /** Unique club identifier (matches clubs.slug in DB) */
  slug: string;
  /** Display name */
  name: string;
  /** Brand primitive colours */
  colors: BrandPrimitives;
  /** Club logo URL (optional — may come from DB) */
  logoUrl?: string;
  /** Club website (optional) */
  websiteUrl?: string;
}
