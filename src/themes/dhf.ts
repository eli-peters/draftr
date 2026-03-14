import type { ClubTheme } from "@/types/theme";

/**
 * Dark Horse Flyers brand theme.
 *
 * Colour values verified against DHF brand swatch.
 * These primitives feed into the semantic token layer in globals.css.
 */
export const dhfTheme: ClubTheme = {
  slug: "dark-horse-flyers",
  name: "Dark Horse Flyers Cycling Club",
  colors: {
    primary: "#0085B6",   // DHF Cyan — dominant brand colour
    danger: "#C10F33",    // DHF Crimson — warnings, destructive actions
    accent: "#86142F",    // DHF Maroon — subtle accents, hover states
    black: "#201D1D",     // DHF Black — text, dark backgrounds
    white: "#FFFFFF",     // DHF White — light backgrounds
    muted: "#999FA3",     // DHF Silver — muted text, borders, disabled
  },
  logoUrl: undefined,     // Will come from DB/storage
  websiteUrl: "https://darkhorseflyers.ca",
};
