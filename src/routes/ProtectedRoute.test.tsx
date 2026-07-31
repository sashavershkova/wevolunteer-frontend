import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
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

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<p>Protected content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows a loading state while OIDC auth is loading', () => {
    mockAuth({ isLoading: true })

    renderProtectedRoute()

    expect(screen.getByRole('heading', { name: 'Loading...' })).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('shows an auth error message', () => {
    mockAuth({ errorMessage: 'Something went wrong' })

    renderProtectedRoute()

    expect(screen.getByRole('heading', { name: 'Auth error' })).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows the login page when unauthenticated', () => {
    mockAuth({ isAuthenticated: false })

    renderProtectedRoute()

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('shows a loading state when authenticated but the profile has not initialized yet', () => {
    mockAuth({ isAuthenticated: true, isProfileInitialized: false })

    renderProtectedRoute()

    expect(screen.getByRole('heading', { name: 'Loading...' })).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the protected route once authenticated and the profile has initialized', () => {
    mockAuth({ isAuthenticated: true, isProfileInitialized: true })

    renderProtectedRoute()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
