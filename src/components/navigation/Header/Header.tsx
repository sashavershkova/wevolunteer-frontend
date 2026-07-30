import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAppAuth } from '../../../contexts/AuthContext'
import { NotificationsIcon } from '../../shared/icons'
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

function navLinkClassName({ isActive }: { isActive: boolean }): string | undefined {
  return isActive ? 'is-active' : undefined
}

function Header() {
  const auth = useAppAuth()
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

  return (
    <header className="app-header">
      <Link to="/" className="app-header-brand">
        <svg className="app-header-logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="16" className="app-header-logo-bg" />
          <path
            d="M16 22.3c-2.8-2.6-7.6-5.9-7.6-9.8 0-2.2 1.7-3.7 3.8-3.7 1.5 0 2.7.9 3.3 2z"
            className="app-header-logo-fill"
          />
          <path
            d="M16 22.3c2.8-2.6 7.6-5.9 7.6-9.8 0-2.2-1.7-3.7-3.8-3.7-1.5 0-2.7.9-3.3 2z"
            className="app-header-logo-fill app-header-logo-fill-light"
          />
        </svg>
        <span className="app-header-wordmark">WeVolunteer</span>
      </Link>

      <nav className="app-header-nav" aria-label="Main">
        {auth.userProfile && (
          <>
            <NavLink to="/opportunities" className={navLinkClassName}>
              Opportunities
            </NavLink>
            <NavLink to="/my-registrations" className={navLinkClassName}>
              My Registrations
            </NavLink>
          </>
        )}
        {auth.organizationProfile && (
          <NavLink to="/organization" className={navLinkClassName}>
            Organization Dashboard
          </NavLink>
        )}
      </nav>

      <div className="app-header-actions">
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
