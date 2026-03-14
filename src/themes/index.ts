import type { ClubTheme } from "@/types/theme";
import { dhfTheme } from "./dhf";

/**
 * Registry of available club themes.
 * Add new clubs here as they onboard.
 */
const themes: Record<string, ClubTheme> = {
  [dhfTheme.slug]: dhfTheme,
};

/**
 * Get a club theme by slug. Falls back to DHF as default.
 */
export function getTheme(slug?: string): ClubTheme {
  if (slug && themes[slug]) {
    return themes[slug];
  }
  return dhfTheme;
}

/**
 * Default theme for the app.
 */
export const defaultTheme = dhfTheme;
