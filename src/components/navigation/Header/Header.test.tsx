import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header'
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

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  beforeEach(() => {
    signOut.mockClear()
  })

  it('links the brand to the home route', () => {
    mockAuth({
      userProfile: { userId: 'user1', name: 'Sasha Vershkova', email: 'sasha@example.com', role: 'VOLUNTEER' },
    })

    renderHeader()

    expect(screen.getByRole('link', { name: /wevolunteer/i })).toHaveAttribute('href', '/')
  })

  it('shows volunteer nav links for a volunteer profile', () => {
    mockAuth({
      userProfile: { userId: 'user1', name: 'Sasha Vershkova', email: 'sasha@example.com', role: 'VOLUNTEER' },
    })

    renderHeader()

    expect(screen.getByRole('link', { name: 'Opportunities' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Registrations' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Favorites' })).toBeInTheDocument()
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
      userProfile: { userId: 'user1', name: 'Sasha Vershkova', email: 'sasha@example.com', role: 'VOLUNTEER' },
    })

    renderHeader()

    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /sasha vershkova/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('shows a My Account link to /profile for a volunteer profile', () => {
    mockAuth({
      userProfile: { userId: 'user1', name: 'Sasha Vershkova', email: 'sasha@example.com', role: 'VOLUNTEER' },
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
      },
    })

    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: /seattle food bank/i }))

    expect(screen.queryByRole('link', { name: 'My Account' })).not.toBeInTheDocument()
  })
})
