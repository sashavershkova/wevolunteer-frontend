import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import HomeRoute from './HomeRoute'
import { useAppAuth } from '../contexts/AuthContext'
import type { OrganizationProfile } from '../services/api/organizationService'
import type { UserProfile } from '../services/api/userService'

// Reproduces the actual refresh-navigation bug: a role-specific page reads
// auth.organizationProfile/userProfile and redirects when they're null, exactly
// like the real organization/volunteer pages do. Before the fix, a refresh could
// commit one render where isAuthenticated was already true but the profile fetch
// hadn't started, making a still-null profile look final and sending the user
// away from the URL they refreshed.

vi.mock('../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)

const organizationFixture: OrganizationProfile = {
  organizationId: 'org-1',
  name: 'Seattle Food Bank',
  description: '',
  email: 'contact@seattlefoodbank.org',
  website: '',
  profileImageUrl: null,
}

const volunteerFixture: UserProfile = {
  userId: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'VOLUNTEER',
  profileImageUrl: null,
}

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

// Mirrors the real per-page guard pattern used by e.g. OrganizationVolunteersPage
// and OrganizationProfilePage (isProfileLoading -> profileErrorMessage ->
// organizationProfile === null -> Navigate).
function FakeOrganizationOnlyPage() {
  const auth = useAppAuth()

  if (auth.isProfileLoading) {
    return (
      <main>
        <h1>Loading your profile...</h1>
      </main>
    )
  }

  if (auth.profileErrorMessage) {
    return (
      <main>
        <h1>Unable to load your profile</h1>
        <p>{auth.profileErrorMessage}</p>
      </main>
    )
  }

  if (auth.organizationProfile === null) {
    return <Navigate to="/" replace />
  }

  return <p>Organization page content: {auth.organizationProfile.name}</p>
}

// Mirrors the real ProfilePage guard pattern (isProfileLoading ->
// profileErrorMessage -> organizationProfile !== null -> Navigate ->
// userProfile === null -> Navigate).
function FakeVolunteerOnlyPage() {
  const auth = useAppAuth()

  if (auth.isProfileLoading) {
    return (
      <main>
        <h1>Loading your profile...</h1>
      </main>
    )
  }

  if (auth.profileErrorMessage) {
    return (
      <main>
        <h1>Unable to load your profile</h1>
        <p>{auth.profileErrorMessage}</p>
      </main>
    )
  }

  if (auth.organizationProfile !== null) {
    return <Navigate to="/organization" replace />
  }

  if (auth.userProfile === null) {
    return <Navigate to="/" replace />
  }

  return <p>Volunteer page content: {auth.userProfile.name}</p>
}

function LocationDisplay() {
  const location = useLocation()
  return <p data-testid="location-display">{location.pathname}</p>
}

function buildTree(initialPath: string) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationDisplay />
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/organization" element={<p>Organization dashboard</p>} />
          <Route path="/organization/volunteers" element={<FakeOrganizationOnlyPage />} />
          <Route path="/organization/profile" element={<FakeOrganizationOnlyPage />} />
          <Route path="/opportunities" element={<p>Browse opportunities</p>} />
          <Route path="/profile" element={<FakeVolunteerOnlyPage />} />
          <Route path="/dashboard" element={<p>Volunteer dashboard</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('refresh navigation race', () => {
  it('stays on /organization/volunteers while unresolved, then renders it once the organization profile resolves', () => {
    mockAuth({
      isProfileInitialized: false,
      isProfileLoading: true,
      organizationProfile: null,
      userProfile: null,
    })

    const { rerender } = render(buildTree('/organization/volunteers'))

    expect(screen.getByRole('heading', { name: 'Loading...' })).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/organization/volunteers')
    expect(screen.queryByText(/Organization page content/)).not.toBeInTheDocument()

    mockAuth({
      isProfileInitialized: true,
      isProfileLoading: false,
      organizationProfile: organizationFixture,
      userProfile: null,
    })

    rerender(buildTree('/organization/volunteers'))

    expect(
      screen.getByText(`Organization page content: ${organizationFixture.name}`),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/organization/volunteers')
  })

  it('stays on /organization/profile while unresolved, then renders it once the organization profile resolves', () => {
    mockAuth({
      isProfileInitialized: false,
      isProfileLoading: true,
      organizationProfile: null,
      userProfile: null,
    })

    const { rerender } = render(buildTree('/organization/profile'))

    expect(screen.getByRole('heading', { name: 'Loading...' })).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/organization/profile')

    mockAuth({
      isProfileInitialized: true,
      isProfileLoading: false,
      organizationProfile: organizationFixture,
      userProfile: null,
    })

    rerender(buildTree('/organization/profile'))

    expect(
      screen.getByText(`Organization page content: ${organizationFixture.name}`),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/organization/profile')
  })

  it('stays on /profile while unresolved, then renders it once the volunteer profile resolves', () => {
    mockAuth({
      isProfileInitialized: false,
      isProfileLoading: true,
      organizationProfile: null,
      userProfile: null,
    })

    const { rerender } = render(buildTree('/profile'))

    expect(screen.getByRole('heading', { name: 'Loading...' })).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/profile')
    expect(screen.queryByText(/Volunteer page content/)).not.toBeInTheDocument()

    mockAuth({
      isProfileInitialized: true,
      isProfileLoading: false,
      organizationProfile: null,
      userProfile: volunteerFixture,
    })

    rerender(buildTree('/profile'))

    expect(screen.getByText(`Volunteer page content: ${volunteerFixture.name}`)).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/profile')
  })

  it('redirects an organization away from a volunteer-only page, but only after initialization completes', () => {
    mockAuth({
      isProfileInitialized: false,
      isProfileLoading: true,
      organizationProfile: null,
      userProfile: null,
    })

    const { rerender } = render(buildTree('/profile'))

    expect(screen.getByRole('heading', { name: 'Loading...' })).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/profile')

    mockAuth({
      isProfileInitialized: true,
      isProfileLoading: false,
      organizationProfile: organizationFixture,
      userProfile: null,
    })

    rerender(buildTree('/profile'))

    expect(screen.getByText('Organization dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/organization')
  })

  it('redirects a volunteer away from an organization-only page, but only after initialization completes', () => {
    mockAuth({
      isProfileInitialized: false,
      isProfileLoading: true,
      organizationProfile: null,
      userProfile: null,
    })

    const { rerender } = render(buildTree('/organization/volunteers'))

    expect(screen.getByRole('heading', { name: 'Loading...' })).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/organization/volunteers')

    mockAuth({
      isProfileInitialized: true,
      isProfileLoading: false,
      organizationProfile: null,
      userProfile: volunteerFixture,
    })

    rerender(buildTree('/organization/volunteers'))

    expect(screen.getByText('Volunteer dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard')
  })

  it('sends a genuinely profile-less user through the existing onboarding/home flow', () => {
    mockAuth({
      isProfileInitialized: true,
      isProfileLoading: false,
      organizationProfile: null,
      userProfile: null,
    })

    render(buildTree('/profile'))

    expect(screen.getByText('Volunteer dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard')
  })

  it('still renders the existing profile-error state instead of redirecting', () => {
    mockAuth({
      isProfileInitialized: true,
      isProfileLoading: false,
      organizationProfile: null,
      userProfile: null,
      profileErrorMessage: 'Unable to load account profile',
    })

    render(buildTree('/organization/volunteers'))

    expect(screen.getByRole('heading', { name: 'Unable to load your profile' })).toBeInTheDocument()
    expect(screen.getByText('Unable to load account profile')).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent('/organization/volunteers')
  })
})
