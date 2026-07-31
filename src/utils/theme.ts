// Single source of truth for theme resolution/persistence logic. The blocking
// bootstrap script in index.html mirrors this resolution order (storage ->
// system preference -> light) so the correct theme is applied before React
// mounts; if this file's logic changes, keep that script in sync.

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'wevolunteer-theme'

const VALID_THEMES: readonly Theme[] = ['light', 'dark']

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (VALID_THEMES as readonly string[]).includes(value)
}

export function getStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : null
  } catch {
    return null
  }
}

export function getSystemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function resolveInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // localStorage may be unavailable (privacy mode, storage quota, disabled
    // storage). Theme still applies for this session via React state and the
    // documentElement attribute; it just won't survive a reload.
  }
}
