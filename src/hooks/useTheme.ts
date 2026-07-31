import { useCallback, useEffect, useState } from 'react'
import { applyTheme, persistTheme, resolveInitialTheme, type Theme } from '../utils/theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      persistTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
