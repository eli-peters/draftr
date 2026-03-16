/**
 * Inline script to prevent FOUC (flash of unstyled content) on dark mode.
 * Runs synchronously before React hydrates.
 * Reads the user's preference from localStorage and applies .dark class.
 */
export const COLOR_MODE_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('draftr-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;
