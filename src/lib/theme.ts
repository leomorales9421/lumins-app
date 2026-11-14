export type ThemeType = 'light' | 'dark' | 'system';

const VALID_THEMES: ThemeType[] = ['light', 'dark', 'system'];

export function isValidTheme(value: unknown): value is ThemeType {
  return typeof value === 'string' && VALID_THEMES.includes(value as ThemeType);
}

/**
 * Resolves the active theme preference.
 * The user's account theme (saved in DB) takes priority over browser local storage.
 * If user has no theme set, falls back to browser localStorage or 'light'.
 */
export function resolveCurrentTheme(userTheme?: string | null): ThemeType {
  if (isValidTheme(userTheme)) {
    return userTheme;
  }
  const local = localStorage.getItem('theme');
  if (isValidTheme(local)) {
    return local;
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

