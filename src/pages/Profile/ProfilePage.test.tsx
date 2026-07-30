import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProfilePage from './ProfilePage'
import { useAppAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)

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
    signOut: vi.fn(),
    signUp: vi.fn(),
    ...overrides,
  })
}

function renderProfilePage() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/organization" element={<h1>Organization Dashboard</h1>} />
        <Route path="/" element={<h1>Home</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProfilePage', () => {
  it('displays the volunteer name, email, and role', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
      },
    })

    renderProfilePage()

    expect(screen.getByRole('heading', { name: 'My Account' })).toBeInTheDocument()
    expect(screen.getByText('Sasha Vershkova')).toBeInTheDocument()
    expect(screen.getByText('sasha@example.com')).toBeInTheDocument()
    expect(screen.getByText('Volunteer')).toBeInTheDocument()
  })

  it('displays an avatar placeholder', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
      },
    })

    renderProfilePage()

    expect(screen.getByRole('img', { name: /sasha vershkova avatar/i })).toBeInTheDocument()
    expect(screen.getByText('SV')).toBeInTheDocument()
  })

  it('disables the upload photo button', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
      },
    })

    renderProfilePage()

    expect(screen.getByRole('button', { name: /upload photo/i })).toBeDisabled()
    expect(screen.getByText(/available soon/i)).toBeInTheDocument()
  })

  it('redirects to /organization for an organization profile', () => {
    mockAuth({
      organizationProfile: {
        organizationId: 'org1',
        name: 'Seattle Food Bank',
        description: '',
        email: '',
        website: '',
      },
    })

    renderProfilePage()

    expect(screen.getByRole('heading', { name: 'Organization Dashboard' })).toBeInTheDocument()
  })

  it('shows a loading state while profile data loads', () => {
    mockAuth({ isProfileLoading: true })

    renderProfilePage()

    expect(screen.getByRole('heading', { name: /loading your profile/i })).toBeInTheDocument()
  })
})
