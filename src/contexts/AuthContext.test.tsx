import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useAuth } from 'react-oidc-context'
import type { User } from 'oidc-client-ts'
import { AuthProvider, useAppAuth } from './AuthContext'
import { getCurrentUser, type UserProfile } from '../services/api/userService'
import { getCurrentOrganization } from '../services/api/organizationService'

vi.mock('react-oidc-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/api/userService', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('../services/api/organizationService', () => ({
  getCurrentOrganization: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedGetCurrentUser = vi.mocked(getCurrentUser)
const mockedGetCurrentOrganization = vi.mocked(getCurrentOrganization)

function buildOidcAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  return {
    isLoading: false,
    isAuthenticated: false,
    error: undefined,
    user: null,
    signinRedirect: vi.fn(),
    removeUser: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>
}

function buildOidcUser(accessToken: string, sub: string, email: string): User {
  return {
    access_token: accessToken,
    profile: { sub, email },
  } as unknown as User
}

function AuthProbe() {
  const auth = useAppAuth()

  return (
    <div>
      <p data-testid="is-profile-loading">{String(auth.isProfileLoading)}</p>
      <p data-testid="is-profile-initialized">{String(auth.isProfileInitialized)}</p>
      <p data-testid="user-profile">{auth.userProfile ? auth.userProfile.name : 'none'}</p>
      <p data-testid="organization-profile">
        {auth.organizationProfile ? auth.organizationProfile.name : 'none'}
      </p>
      <p data-testid="profile-error">{auth.profileErrorMessage ?? 'none'}</p>
    </div>
  )
}

function renderProbe() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  )
}

const volunteerFixture: UserProfile = {
  userId: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'VOLUNTEER',
}

describe('AuthContext profile initialization', () => {
  beforeEach(() => {
    mockedGetCurrentUser.mockReset()
    mockedGetCurrentOrganization.mockReset()
  })

  it('is initialized immediately when the user is unauthenticated', async () => {
    mockedUseAuth.mockReturnValue(buildOidcAuth({ isAuthenticated: false }))

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('is-profile-initialized')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('is-profile-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('user-profile')).toHaveTextContent('none')
    expect(screen.getByTestId('organization-profile')).toHaveTextContent('none')
  })

  it('is not initialized while an authenticated profile lookup is in flight', async () => {
    let resolveUser: (value: UserProfile | null) => void = () => {}
    mockedGetCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        resolveUser = resolve
      }),
    )
    mockedUseAuth.mockReturnValue(
      buildOidcAuth({
        isAuthenticated: true,
        user: buildOidcUser('token-1', 'user-1', 'ada@example.com'),
      }),
    )

    renderProbe()

    expect(screen.getByTestId('is-profile-initialized')).toHaveTextContent('false')
    expect(screen.getByTestId('is-profile-loading')).toHaveTextContent('true')

    resolveUser(volunteerFixture)

    await waitFor(() => {
      expect(screen.getByTestId('is-profile-initialized')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('user-profile')).toHaveTextContent('Ada Lovelace')
    expect(screen.getByTestId('is-profile-loading')).toHaveTextContent('false')
  })

  it('resolves an organization profile and marks initialization complete', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)
    mockedGetCurrentOrganization.mockResolvedValue({
      organizationId: 'org-1',
      name: 'Seattle Food Bank',
      description: '',
      email: 'contact@seattlefoodbank.org',
      website: '',
    })
    mockedUseAuth.mockReturnValue(
      buildOidcAuth({
        isAuthenticated: true,
        user: buildOidcUser('token-2', 'org-1', 'org@example.com'),
      }),
    )

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('is-profile-initialized')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('organization-profile')).toHaveTextContent('Seattle Food Bank')
    expect(screen.getByTestId('is-profile-loading')).toHaveTextContent('false')
  })

  it('marks initialization complete even when the profile lookup fails', async () => {
    mockedGetCurrentUser.mockRejectedValue(new Error('network down'))
    mockedUseAuth.mockReturnValue(
      buildOidcAuth({
        isAuthenticated: true,
        user: buildOidcUser('token-3', 'user-3', 'x@example.com'),
      }),
    )

    renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('is-profile-initialized')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('profile-error')).toHaveTextContent('network down')
    expect(screen.getByTestId('is-profile-loading')).toHaveTextContent('false')
  })

  it('is not left ambiguous on the very first render after auth flips from unauthenticated to authenticated', async () => {
    mockedUseAuth.mockReturnValue(buildOidcAuth({ isAuthenticated: false }))
    let resolveUser: (value: UserProfile | null) => void = () => {}
    mockedGetCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        resolveUser = resolve
      }),
    )

    const { rerender } = renderProbe()

    await waitFor(() => {
      expect(screen.getByTestId('is-profile-initialized')).toHaveTextContent('true')
    })

    mockedUseAuth.mockReturnValue(
      buildOidcAuth({
        isAuthenticated: true,
        user: buildOidcUser('token-4', 'user-4', 'zoe@example.com'),
      }),
    )

    rerender(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    // This must read false on the very first render committed after the auth flip.
    // Before the fix, isProfileLoading/isProfileInitialized only updated a render
    // later (from inside AuthContext's effect), so a page reading a still-null
    // profile on this exact render would treat "no profile" as final and redirect
    // away before the real lookup had even started.
    expect(screen.getByTestId('is-profile-initialized')).toHaveTextContent('false')
    expect(screen.getByTestId('is-profile-loading')).toHaveTextContent('true')

    resolveUser({ ...volunteerFixture, name: 'Zoe' })

    await waitFor(() => {
      expect(screen.getByTestId('is-profile-initialized')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('user-profile')).toHaveTextContent('Zoe')
  })
})
