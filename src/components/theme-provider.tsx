"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ClubTheme } from "@/types/theme";
import { defaultTheme } from "@/themes";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  club: ClubTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  club?: ClubTheme;
  defaultMode?: ThemeMode;
}

/**
 * Injects club brand primitives as CSS custom properties on :root
 * and manages light/dark mode toggling.
 *
 * Club switching = passing a different `club` prop.
 * All components downstream use semantic tokens (--primary, --danger, etc.)
 * which reference these primitives.
 */
export function ThemeProvider({
  children,
  club = defaultTheme,
  defaultMode = "dark",
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  // Inject brand primitives as CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = club;

    root.style.setProperty("--brand-primary", colors.primary);
    root.style.setProperty("--brand-danger", colors.danger);
    root.style.setProperty("--brand-accent", colors.accent);
    root.style.setProperty("--brand-black", colors.black);
    root.style.setProperty("--brand-white", colors.white);
    root.style.setProperty("--brand-muted", colors.muted);
  }, [club]);

  // Handle dark mode class toggling
  useEffect(() => {
    const root = document.documentElement;

    const applyMode = (isDark: boolean) => {
      root.classList.toggle("dark", isDark);
    };

    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyMode(mq.matches);

      const handler = (e: MediaQueryListEvent) => applyMode(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    applyMode(mode === "dark");
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ club, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
