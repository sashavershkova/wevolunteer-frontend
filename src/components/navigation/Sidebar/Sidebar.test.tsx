import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAppAuth } from '../../../contexts/AuthContext'

vi.mock('../../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const signOut = vi.fn()

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

function renderSidebar(
  initialPath = '/',
  {
    isMobileOpen = false,
    onMobileClose = vi.fn(),
  }: Partial<{ isMobileOpen: boolean; onMobileClose: () => void }> = {},
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={onMobileClose} />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    signOut.mockClear()
  })

  it('shows the volunteer nav items for a volunteer profile', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderSidebar()

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Browse Opportunities' })).toHaveAttribute(
      'href',
      '/opportunities',
    )
    expect(screen.getByRole('link', { name: 'My Registrations' })).toHaveAttribute(
      'href',
      '/my-registrations',
    )
    expect(screen.getByRole('link', { name: 'My Profile' })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('link', { name: 'Favorites' })).toHaveAttribute('href', '/favorites')
    expect(screen.getByRole('link', { name: 'Messages' })).toHaveAttribute('href', '/messages')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    expect(screen.queryByRole('link', { name: 'My Opportunities' })).not.toBeInTheDocument()
  })

  it('shows the organization nav items for an organization profile', () => {
    mockAuth({
      organizationProfile: {
        organizationId: 'org1',
        name: 'Helping Hands',
        description: '',
        email: '',
        website: '',
        profileImageUrl: null,
      },
    })

    renderSidebar()

    expect(screen.getByRole('link', { name: 'My Opportunities' })).toHaveAttribute(
      'href',
      '/organization/opportunities',
    )
    expect(screen.getByRole('link', { name: 'Registrations' })).toHaveAttribute(
      'href',
      '/organization/registrations',
    )
    expect(screen.getByRole('link', { name: 'Volunteers' })).toHaveAttribute(
      'href',
      '/organization/volunteers',
    )
    expect(screen.getByRole('link', { name: 'Organization Profile' })).toHaveAttribute(
      'href',
      '/organization/profile',
    )
    expect(screen.queryByRole('link', { name: 'Browse Opportunities' })).not.toBeInTheDocument()
  })

  it('highlights only Dashboard, not My Opportunities, when on /organization', () => {
    mockAuth({
      organizationProfile: {
        organizationId: 'org1',
        name: 'Helping Hands',
        description: '',
        email: '',
        website: '',
        profileImageUrl: null,
      },
    })

    renderSidebar('/organization')

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveClass('is-active')
    expect(screen.getByRole('link', { name: 'My Opportunities' })).not.toHaveClass('is-active')
  })

  it('highlights only My Opportunities, not Dashboard, when on /organization/opportunities', () => {
    mockAuth({
      organizationProfile: {
        organizationId: 'org1',
        name: 'Helping Hands',
        description: '',
        email: '',
        website: '',
        profileImageUrl: null,
      },
    })

    renderSidebar('/organization/opportunities')

    expect(screen.getByRole('link', { name: 'My Opportunities' })).toHaveClass('is-active')
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveClass('is-active')
  })

  it('renders nothing while onboarding (no profile yet)', () => {
    mockAuth({})

    const { container } = renderSidebar()

    expect(container).toBeEmptyDOMElement()
  })

  it('signs out when Log Out is clicked', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }))

    expect(signOut).toHaveBeenCalledTimes(1)
  })

  describe('mobile drawer', () => {
    it('does not render a backdrop when closed', () => {
      mockAuth({
        userProfile: {
          userId: 'user1',
          name: 'Sasha Vershkova',
          email: 'sasha@example.com',
          role: 'VOLUNTEER',
          profileImageUrl: null,
        },
      })

      const { container } = renderSidebar('/', { isMobileOpen: false })

      expect(container.querySelector('.app-sidebar-backdrop')).not.toBeInTheDocument()
    })

    it('renders a backdrop that closes the menu when clicked', () => {
      mockAuth({
        userProfile: {
          userId: 'user1',
          name: 'Sasha Vershkova',
          email: 'sasha@example.com',
          role: 'VOLUNTEER',
          profileImageUrl: null,
        },
      })
      const onMobileClose = vi.fn()

      const { container } = renderSidebar('/', { isMobileOpen: true, onMobileClose })

      const backdrop = container.querySelector('.app-sidebar-backdrop')
      expect(backdrop).toBeInTheDocument()

      fireEvent.click(backdrop as Element)

      expect(onMobileClose).toHaveBeenCalledTimes(1)
    })

    it('closes the menu when a nav link is clicked', () => {
      mockAuth({
        userProfile: {
          userId: 'user1',
          name: 'Sasha Vershkova',
          email: 'sasha@example.com',
          role: 'VOLUNTEER',
          profileImageUrl: null,
        },
      })
      const onMobileClose = vi.fn()

      renderSidebar('/', { isMobileOpen: true, onMobileClose })
      fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }))

      expect(onMobileClose).toHaveBeenCalledTimes(1)
    })
  })
})
