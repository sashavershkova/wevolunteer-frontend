import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppAuth } from '../../../contexts/AuthContext'
import { useTheme } from '../../../hooks/useTheme'
import { NotificationsIcon, SunIcon, MoonIcon } from '../../shared/icons'
import BrandMark from '../../shared/BrandMark/BrandMark'
import './Header.css'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Header() {
  const auth = useAppAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const displayName = auth.userProfile?.name ?? auth.organizationProfile?.name ?? auth.email
  const role = auth.userProfile ? 'Volunteer' : auth.organizationProfile ? 'Organization' : null

  function handleSignOut() {
    setIsMenuOpen(false)
    auth.signOut()
  }

  const themeToggleLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <header className="app-header">
      <Link to="/" className="app-header-brand">
        <BrandMark />
        <span className="app-header-wordmark">WeVolunteer</span>
      </Link>

      <div className="app-header-actions">
        <button
          type="button"
          className="app-header-theme-toggle"
          onClick={toggleTheme}
          aria-pressed={theme === 'dark'}
          aria-label={themeToggleLabel}
          title={themeToggleLabel}
        >
          {theme === 'dark' ? (
            <SunIcon aria-hidden="true" />
          ) : (
            <MoonIcon aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className="app-header-bell"
          aria-label="Notifications (coming soon)"
          title="Notifications — coming soon"
          disabled
        >
          <NotificationsIcon aria-hidden="true" />
        </button>

        <div className="app-header-account-wrapper" ref={accountRef}>
          <button
            type="button"
            className="app-header-account"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="app-header-avatar">{getInitials(displayName)}</span>
            <span className="app-header-identity">
              <span className="app-header-name">{displayName}</span>
              {role && <span className="app-header-role">{role}</span>}
            </span>
            <svg className="app-header-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="app-header-menu">
              {auth.userProfile && (
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                  My Account
                </Link>
              )}
              <button type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
