'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { IconContext } from '@phosphor-icons/react';
import type { ClubTheme, ColorMode } from '@/types/theme';
import { defaultTheme } from '@/themes';

interface ThemeContextValue {
  club: ClubTheme;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  resolvedColorMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'draftr-theme';

function readStoredMode(): ColorMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function subscribeToMediaQuery(callback: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  club?: ClubTheme;
}

/**
 * Manages club brand primitives and color mode (light/dark/system).
 *
 * Club switching = passing a different `club` prop.
 * Color mode is persisted in localStorage and respects OS preference.
 *
 * For the default Draftr theme, all primitive values are baked into
 * the generated tokens.css. ThemeProvider only injects overrides when
 * a non-default club is active.
 */
export function ThemeProvider({ children, club = defaultTheme }: ThemeProviderProps) {
  const [colorMode, setColorModeState] = useState<ColorMode>(readStoredMode);

  // Track system dark preference reactively
  const systemPrefersDark = useSyncExternalStore(
    subscribeToMediaQuery,
    getSystemPrefersDark,
    () => false, // server snapshot
  );

  // Derive resolved mode (no setState needed)
  function resolveColorMode(): 'light' | 'dark' {
    if (colorMode === 'dark') return 'dark';
    if (colorMode === 'light') return 'light';
    return systemPrefersDark ? 'dark' : 'light';
  }
  const resolvedColorMode = resolveColorMode();

  // Apply .dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedColorMode === 'dark');
  }, [resolvedColorMode]);

  // Cross-tab sync via storage event
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        const val = e.newValue as ColorMode | null;
        setColorModeState(val === 'light' || val === 'dark' || val === 'system' ? val : 'system');
      }
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Inject brand primitive overrides for non-default clubs.
  // For the default theme, tokens.css already has the correct values.
  useEffect(() => {
    const root = document.documentElement;
    const isDefault = club.slug === defaultTheme.slug;

    if (isDefault) {
      // Clear any previously injected overrides
      root.style.removeProperty('--color-primary-500');
      root.style.removeProperty('--color-secondary-500');
      return;
    }

    // Club override — inject seed colours as the 500-step primitives.
    // Components reference semantic tokens which reference these primitives.
    const { colors } = club;
    root.style.setProperty('--color-primary-500', colors.primary);
    root.style.setProperty('--color-secondary-500', colors.secondary);
    if (colors.neutral) {
      root.style.setProperty('--color-neutral-500', colors.neutral);
    }
    if (colors.danger) {
      root.style.setProperty('--color-error-500', colors.danger);
    }
  }, [club]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ club, colorMode, setColorMode, resolvedColorMode }}>
      <IconContext.Provider value={{ weight: 'bold' }}>{children}</IconContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
