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
  const resolvedColorMode: 'light' | 'dark' =
    colorMode === 'dark'
      ? 'dark'
      : colorMode === 'light'
        ? 'light'
        : systemPrefersDark
          ? 'dark'
          : 'light';

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

  // Inject brand primitives as CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = club;

    root.style.setProperty('--brand-primary', colors.primary);
    root.style.setProperty('--brand-danger', colors.danger);
    root.style.setProperty('--brand-accent', colors.accent);
    root.style.setProperty('--brand-black', colors.black);
    root.style.setProperty('--brand-white', colors.white);
    root.style.setProperty('--brand-muted', colors.muted);
  }, [club]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ club, colorMode, setColorMode, resolvedColorMode }}>
      <IconContext.Provider value={{ weight: 'duotone' }}>{children}</IconContext.Provider>
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
