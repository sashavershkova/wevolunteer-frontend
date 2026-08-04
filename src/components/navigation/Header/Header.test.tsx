import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header'
import { useAppAuth } from '../../../contexts/AuthContext'
import { THEME_STORAGE_KEY } from '../../../utils/theme'

vi.mock('../../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const signOut = vi.fn()

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

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>>) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'sasha@example.com',
    userId: 'user1',
    accessToken: 'token',
    userProfile: null,
    organizationProfile: null,
    isProfileLoading: false,
    isProfileInitialized: true,
    profileErrorMessage: null,
    updateUserProfile: vi.fn(),
    updateOrganizationProfile: vi.fn(),
    signIn: vi.fn(),
    signOut,
    signUp: vi.fn(),
    ...overrides,
  })
}

function renderHeader({
  isMobileSidebarOpen = false,
  onMobileSidebarToggle = vi.fn(),
}: Partial<{
  isMobileSidebarOpen: boolean
  onMobileSidebarToggle: () => void
}> = {}) {
  return render(
    <MemoryRouter>
      <Header
        isMobileSidebarOpen={isMobileSidebarOpen}
        onMobileSidebarToggle={onMobileSidebarToggle}
      />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  beforeEach(() => {
    signOut.mockClear()
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
    mockMatchMedia(false)
  })

  afterEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
    vi.unstubAllGlobals()
  })

  it('links the brand to the home route', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderHeader()

    expect(screen.getByRole('link', { name: /wevolunteer/i })).toHaveAttribute('href', '/')
  })

  it('shows no nav links for a volunteer profile (Sidebar covers volunteer navigation)', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderHeader()

    expect(screen.queryByRole('link', { name: 'Opportunities' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Registrations' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Favorites' })).not.toBeInTheDocument()
    expect(screen.getByText('Sasha Vershkova')).toBeInTheDocument()
    expect(screen.getByText('SV')).toBeInTheDocument()
    expect(screen.getByText('Volunteer')).toBeInTheDocument()
  })

  it('shows no nav links for an organization profile (Sidebar covers org navigation)', () => {
    mockAuth({
      organizationProfile: {
        organizationId: 'org1',
        name: 'Seattle Food Bank',
        description: '',
        email: '',
        website: '',
        profileImageUrl: null,
      },
    })

    renderHeader()

    expect(screen.queryByRole('link', { name: 'Organization Dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Opportunities' })).not.toBeInTheDocument()
    expect(screen.getByText('SB')).toBeInTheDocument()
    expect(screen.getByText('Organization')).toBeInTheDocument()
  })

  it('shows no nav links or role while onboarding (no profile yet)', () => {
    mockAuth({})

    renderHeader()

    expect(screen.queryByRole('link', { name: 'Opportunities' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Favorites' })).not.toBeInTheDocument()
  })

  it('opens the account menu and signs out when clicked', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderHeader()

    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /sasha vershkova/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('shows a My Account link to /profile for a volunteer profile', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: /sasha vershkova/i }))

    expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/profile')
  })

  it('does not show a My Account link for an organization profile', () => {
    mockAuth({
      organizationProfile: {
        organizationId: 'org1',
        name: 'Seattle Food Bank',
        description: '',
        email: '',
        website: '',
        profileImageUrl: null,
      },
    })

    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: /seattle food bank/i }))

    expect(screen.queryByRole('link', { name: 'My Account' })).not.toBeInTheDocument()
  })

  describe('theme toggle', () => {
    beforeEach(() => {
      mockAuth({
        userProfile: {
          userId: 'user1',
          name: 'Sasha Vershkova',
          email: 'sasha@example.com',
          role: 'VOLUNTEER',
          profileImageUrl: null,
        },
      })
    })

    it('shows the Moon icon and a "Switch to dark mode" label when the theme is light', () => {
      renderHeader()

      const toggle = screen.getByRole('button', { name: 'Switch to dark mode' })

      expect(toggle).toHaveAttribute('aria-pressed', 'false')
      expect(toggle).toHaveAttribute('title', 'Switch to dark mode')
      expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    })

    it('shows the Sun icon and a "Switch to light mode" label when a dark theme is saved', () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')

      renderHeader()

      const toggle = screen.getByRole('button', { name: 'Switch to light mode' })

      expect(toggle).toHaveAttribute('aria-pressed', 'true')
      expect(toggle).toHaveAttribute('title', 'Switch to light mode')
    })

    it('switches from light to dark when clicked, updating the root attribute and localStorage', () => {
      renderHeader()

      fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

      expect(screen.getByRole('button', { name: 'Switch to light mode' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(document.documentElement.dataset.theme).toBe('dark')
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    })

    it('switches from dark back to light when clicked again', () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')

      renderHeader()

      fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }))

      expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
      expect(document.documentElement.dataset.theme).toBe('light')
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    })

    it('toggles via keyboard interaction on the button itself', async () => {
      const user = userEvent.setup()
      renderHeader()

      const toggle = screen.getByRole('button', { name: 'Switch to dark mode' })
      toggle.focus()
      await user.keyboard('{Enter}')

      expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
      expect(document.documentElement.dataset.theme).toBe('dark')
    })
  })

  describe('mobile sidebar toggle', () => {
    // The toggle button is only visually shown under a max-width media query
    // (real mobile viewports), which jsdom's default desktop-width test
    // viewport never matches - it's legitimately display:none there, so it's
    // excluded from the accessible-roles tree. Query it directly by class
    // instead of by role to test its markup/behavior independent of that.
    it('shows an "Open menu" button for a volunteer profile', () => {
      mockAuth({
        userProfile: {
          userId: 'user1',
          name: 'Sasha Vershkova',
          email: 'sasha@example.com',
          role: 'VOLUNTEER',
          profileImageUrl: null,
        },
      })

      const { container } = renderHeader()
      const toggle = container.querySelector('.app-header-menu-toggle')

      expect(toggle).toHaveAttribute('aria-label', 'Open menu')
    })

    it('shows an "Open menu" button for an organization profile', () => {
      mockAuth({
        organizationProfile: {
          organizationId: 'org1',
          name: 'Seattle Food Bank',
          description: '',
          email: '',
          website: '',
          profileImageUrl: null,
        },
      })

      const { container } = renderHeader()
      const toggle = container.querySelector('.app-header-menu-toggle')

      expect(toggle).toHaveAttribute('aria-label', 'Open menu')
    })

    it('does not show a menu toggle while onboarding (no profile yet)', () => {
      mockAuth({})

      const { container } = renderHeader()

      expect(container.querySelector('.app-header-menu-toggle')).not.toBeInTheDocument()
    })

    it('shows "Close menu" and calls onMobileSidebarToggle when clicked', () => {
      mockAuth({
        userProfile: {
          userId: 'user1',
          name: 'Sasha Vershkova',
          email: 'sasha@example.com',
          role: 'VOLUNTEER',
          profileImageUrl: null,
        },
      })
      const onMobileSidebarToggle = vi.fn()

      const { container } = renderHeader({
        isMobileSidebarOpen: true,
        onMobileSidebarToggle,
      })
      const toggle = container.querySelector('.app-header-menu-toggle') as Element

      expect(toggle).toHaveAttribute('aria-label', 'Close menu')
      expect(toggle).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(toggle)

      expect(onMobileSidebarToggle).toHaveBeenCalledTimes(1)
    })
  })
})
