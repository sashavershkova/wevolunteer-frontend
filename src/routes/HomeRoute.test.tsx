import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HomeRoute from './HomeRoute'
import { useAppAuth } from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'a@example.com',
    userId: 'user-1',
    accessToken: 'token',
    userProfile: null,
    organizationProfile: null,
    isProfileLoading: false,
    isProfileInitialized: true,
    profileErrorMessage: null,
    updateUserProfile: vi.fn(),
    updateOrganizationProfile: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    ...overrides,
  })
}

function renderHomeRoute() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/organization" element={<p>Organization dashboard</p>} />
        <Route path="/dashboard" element={<p>Volunteer dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HomeRoute', () => {
  it('shows a loading state while the profile is loading', () => {
    mockAuth({ isProfileLoading: true })

    renderHomeRoute()

    expect(screen.getByRole('heading', { name: 'Loading...' })).toBeInTheDocument()
    expect(screen.queryByText('Organization dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Browse opportunities')).not.toBeInTheDocument()
  })

  it('redirects an organization to /organization', () => {
    mockAuth({
      organizationProfile: {
        organizationId: 'org-1',
        name: 'Seattle Food Bank',
        description: '',
        email: 'contact@seattlefoodbank.org',
        website: '',
        profileImageUrl: null,
      },
    })

    renderHomeRoute()

    expect(screen.getByText('Organization dashboard')).toBeInTheDocument()
  })

  it('redirects a volunteer to /dashboard', () => {
    mockAuth({ organizationProfile: null })

    renderHomeRoute()

    expect(screen.getByText('Volunteer dashboard')).toBeInTheDocument()
  })
})
