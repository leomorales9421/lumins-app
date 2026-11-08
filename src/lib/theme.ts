export type ThemeType = 'light' | 'dark' | 'system';

const VALID_THEMES: ThemeType[] = ['light', 'dark', 'system'];

export function isValidTheme(value: unknown): value is ThemeType {
  return typeof value === 'string' && VALID_THEMES.includes(value as ThemeType);
}

/**
 * Resolves the active theme preference without causing unexpected flips.
 * Local storage is kept in sync with the active DOM theme; if localStorage
 * is empty (e.g. fresh login), it falls back to the user's saved DB theme,
 * or 'light' by default.
 */
export function resolveCurrentTheme(userTheme?: string | null): ThemeType {
  const local = localStorage.getItem('theme');
  if (isValidTheme(local)) {
    return local;
  }
  if (isValidTheme(userTheme)) {
    return userTheme;
  }
  return 'light';
}

export function applyThemeToDom(theme: ThemeType, persistLocal = true): void {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  const effectiveTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  root.classList.add(effectiveTheme);

  if (persistLocal) {
    localStorage.setItem('theme', theme);
  }
  window.dispatchEvent(new Event('theme-changed'));
}

