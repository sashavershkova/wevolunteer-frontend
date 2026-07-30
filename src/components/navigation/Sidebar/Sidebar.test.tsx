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
    profileErrorMessage: null,
    updateUserProfile: vi.fn(),
    updateOrganizationProfile: vi.fn(),
    signIn: vi.fn(),
    signOut,
    signUp: vi.fn(),
    ...overrides,
  })
}

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    signOut.mockClear()
  })

  it('shows the volunteer nav items for a volunteer profile', () => {
    mockAuth({
      userProfile: { userId: 'user1', name: 'Sasha Vershkova', email: 'sasha@example.com', role: 'VOLUNTEER' },
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
      },
    })

    renderSidebar()

    expect(screen.getByRole('link', { name: 'My Opportunities' })).toHaveAttribute(
      'href',
      '/organization',
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

  it('renders nothing while onboarding (no profile yet)', () => {
    mockAuth({})

    const { container } = renderSidebar()

    expect(container).toBeEmptyDOMElement()
  })

  it('signs out when Log Out is clicked', () => {
    mockAuth({
      userProfile: { userId: 'user1', name: 'Sasha Vershkova', email: 'sasha@example.com', role: 'VOLUNTEER' },
    })

    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }))

    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
