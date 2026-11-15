export type ThemeType = 'light' | 'dark' | 'system';
export type AccentColor = 'teal' | 'coral' | 'amber';
export type MenuLayout = 'top' | 'sidebar';

const VALID_THEMES: ThemeType[] = ['light', 'dark', 'system'];
const VALID_ACCENTS: AccentColor[] = ['teal', 'coral', 'amber'];
const VALID_LAYOUTS: MenuLayout[] = ['top', 'sidebar'];

export interface AccentPalette {
  id: AccentColor;
  label: string;
  swatch: string;
  light: {
    accent: string;
    hover: string;
    fg: string;
    on: string;
    soft: string;
    border: string;
  };
  dark: {
    accent: string;
    hover: string;
    fg: string;
    on: string;
    soft: string;
    border: string;
  };
}

export const LUMINS_ACCENT_PALETTES: Record<AccentColor, AccentPalette> = {
  teal: {
    id: 'teal',
    label: 'Turquesa Lumins',
    swatch: '#12A9A8',
    light: {
      accent: '#12A9A8',
      hover: '#0E8786',
      fg: '#0E8786',
      on: '#FFFFFF',
      soft: 'rgba(18, 169, 168, 0.10)',
      border: 'rgba(18, 169, 168, 0.28)',
    },
    dark: {
      accent: '#12A9A8',
      hover: '#16C0BF',
      fg: '#4CD4D3',
      on: '#FFFFFF',
      soft: 'rgba(18, 169, 168, 0.16)',
      border: 'rgba(76, 212, 211, 0.35)',
    },
  },
  coral: {
    id: 'coral',
    label: 'Coral Energía',
    swatch: '#FF665E',
    light: {
      accent: '#FF665E',
      hover: '#E54D45',
      fg: '#D94841',
      on: '#FFFFFF',
      soft: 'rgba(255, 102, 94, 0.10)',
      border: 'rgba(255, 102, 94, 0.28)',
    },
    dark: {
      accent: '#FF665E',
      hover: '#FF7D76',
      fg: '#FF857E',
      on: '#FFFFFF',
      soft: 'rgba(255, 102, 94, 0.16)',
      border: 'rgba(255, 133, 126, 0.35)',
    },
  },
  amber: {
    id: 'amber',
    label: 'Ámbar Solar',
    swatch: '#FFCC40',
    light: {
      accent: '#F5B81A',
      hover: '#DDA20E',
      fg: '#A67600',
      on: '#13151A',
      soft: 'rgba(255, 204, 64, 0.16)',
      border: 'rgba(217, 155, 0, 0.32)',
    },
    dark: {
      accent: '#FFCC40',
      hover: '#FFD866',
      fg: '#FFCC40',
      on: '#13151A',
      soft: 'rgba(255, 204, 64, 0.16)',
      border: 'rgba(255, 204, 64, 0.35)',
    },
  },
};

export function isValidTheme(value: unknown): value is ThemeType {
  return typeof value === 'string' && VALID_THEMES.includes(value as ThemeType);
}

export function isValidAccentColor(value: unknown): value is AccentColor {
  return typeof value === 'string' && VALID_ACCENTS.includes(value as AccentColor);
}

export function isValidMenuLayout(value: unknown): value is MenuLayout {
  return typeof value === 'string' && VALID_LAYOUTS.includes(value as MenuLayout);
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

export function resolveAccentColor(userAccent?: unknown): AccentColor {
  if (isValidAccentColor(userAccent)) {
    return userAccent;
  }
  if (typeof window === 'undefined') return 'teal';
  const local = localStorage.getItem('lumins_accent');
  return isValidAccentColor(local) ? local : 'teal';
}

export function resolveMenuLayout(userMenuLayout?: unknown): MenuLayout {
  if (isValidMenuLayout(userMenuLayout)) {
    return userMenuLayout;
  }
  if (typeof window === 'undefined') return 'top';
  const local = localStorage.getItem('lumins_menu_layout');
  return isValidMenuLayout(local) ? local : 'top';
}

export function applyAccentToDom(accent: AccentColor, persistLocal = true): void {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  const isDark = root.classList.contains('dark');
  const palette = LUMINS_ACCENT_PALETTES[accent] || LUMINS_ACCENT_PALETTES.teal;
  const tokens = isDark ? palette.dark : palette.light;

  root.style.setProperty('--lumins-accent', tokens.accent);
  root.style.setProperty('--lumins-accent-hover', tokens.hover);
  root.style.setProperty('--lumins-accent-fg', tokens.fg);
  root.style.setProperty('--lumins-accent-on', tokens.on);
  root.style.setProperty('--lumins-accent-soft', tokens.soft);
  root.style.setProperty('--lumins-accent-border', tokens.border);
  root.dataset.accent = accent;

  if (persistLocal) {
    localStorage.setItem('lumins_accent', accent);
  }
  window.dispatchEvent(new CustomEvent('accent-changed', { detail: { accent } }));
}

export function applyMenuLayout(layout: MenuLayout, persistLocal = true): void {
  if (typeof window === 'undefined') return;
  if (persistLocal) {
    localStorage.setItem('lumins_menu_layout', layout);
  }
  window.dispatchEvent(new CustomEvent('menu-layout-changed', { detail: { layout } }));
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

  // Re-apply accent tokens so light/dark contrast stays calibrated
  applyAccentToDom(resolveAccentColor(), false);
  window.dispatchEvent(new Event('theme-changed'));
}
