import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  persistTheme,
  resolveInitialTheme,
  THEME_STORAGE_KEY,
} from './theme'

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('theme utility', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
    vi.unstubAllGlobals()
  })

  describe('resolveInitialTheme', () => {
    it('restores a saved dark theme', () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      mockMatchMedia(false)

      expect(resolveInitialTheme()).toBe('dark')
    })

    it('restores a saved light theme', () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
      mockMatchMedia(true)

      expect(resolveInitialTheme()).toBe('light')
    })

    it('uses the dark system preference when nothing is saved', () => {
      mockMatchMedia(true)

      expect(resolveInitialTheme()).toBe('dark')
    })

    it('uses the light system preference when nothing is saved', () => {
      mockMatchMedia(false)

      expect(resolveInitialTheme()).toBe('light')
    })

    it('falls back to the system preference when the saved value is invalid', () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'blue')
      mockMatchMedia(true)

      expect(resolveInitialTheme()).toBe('dark')
    })

    it('falls back to light when neither a saved value nor matchMedia is available', () => {
      // @ts-expect-error simulating an environment without matchMedia support
      delete window.matchMedia

      expect(resolveInitialTheme()).toBe('light')
    })
  })

  describe('getStoredTheme', () => {
    it('returns null when storage access throws', () => {
      const originalGetItem = window.localStorage.getItem
      window.localStorage.getItem = () => {
        throw new Error('storage unavailable')
      }

      expect(getStoredTheme()).toBeNull()

      window.localStorage.getItem = originalGetItem
    })
  })

  describe('getSystemTheme', () => {
    it('returns light when matchMedia throws', () => {
      window.matchMedia = vi.fn().mockImplementation(() => {
        throw new Error('not supported')
      })

      expect(getSystemTheme()).toBe('light')
    })
  })

  describe('applyTheme', () => {
    it('sets the data-theme attribute on the root element', () => {
      applyTheme('dark')

      expect(document.documentElement.dataset.theme).toBe('dark')

      applyTheme('light')

      expect(document.documentElement.dataset.theme).toBe('light')
    })
  })

  describe('persistTheme', () => {
    it('writes the theme to localStorage under the project-specific key', () => {
      persistTheme('dark')

      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    })

    it('does not throw when storage access fails', () => {
      const originalSetItem = window.localStorage.setItem
      window.localStorage.setItem = () => {
        throw new Error('storage unavailable')
      }

      expect(() => persistTheme('dark')).not.toThrow()

      window.localStorage.setItem = originalSetItem
    })
  })
})
