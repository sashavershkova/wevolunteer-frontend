import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from './SettingsPage'
import { useAppAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)

const userFixture = {
  userId: 'user1',
  name: 'Renata Murzina',
  email: 'renata@example.com',
  role: 'VOLUNTEER' as const,
  profileImageUrl: null,
}

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'renata@example.com',
    userId: 'user1',
    accessToken: 'token',
    userProfile: userFixture,
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <SettingsPage />
    </MemoryRouter>,
  )
}

describe('SettingsPage', () => {
  beforeEach(() => {
    mockAuth()
  })

  it('renders the page heading and subtitle', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Manage your account and preferences.')).toBeInTheDocument()
  })

  it('shows the real name, email, and account type from AuthContext', () => {
    renderPage()

    expect(screen.getByText(userFixture.name)).toBeInTheDocument()
    expect(screen.getByText(userFixture.email)).toBeInTheDocument()
    expect(screen.getByText('Volunteer')).toBeInTheDocument()
  })

  it('links to the profile page without duplicating the editor', () => {
    renderPage()

    const link = screen.getByRole('link', { name: 'View My Profile' })
    expect(link).toHaveAttribute('href', '/profile')
    expect(screen.queryByRole('button', { name: 'Upload Photo' })).not.toBeInTheDocument()
  })

  it('renders all three notification toggles as disabled checkboxes', () => {
    renderPage()

    expect(screen.getByRole('checkbox', { name: 'Email notifications' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Opportunity reminders' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'New opportunity alerts' })).toBeDisabled()
    expect(
      screen.getByText('Notification preferences will become available in a future update.'),
    ).toBeInTheDocument()
  })

  it('renders integration tiles with disabled actions', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Google Calendar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'CSV Export' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
  })

  it('describes password management via Cognito and marks 2FA/session management as coming soon', () => {
    renderPage()

    expect(screen.getByText('Managed through Amazon Cognito.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manage Password' })).toBeDisabled()
    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument()
    expect(screen.getByText('Session management')).toBeInTheDocument()
  })

  it('marks every non-functional block with a Coming Soon badge', () => {
    const { container } = renderPage()

    // Notifications, Integrations, Security, Data & Privacy -- every block
    // except the real Account Information section.
    const badges = container.querySelectorAll('.settings-badge')
    expect(badges).toHaveLength(4)
    badges.forEach((badge) => expect(badge).toHaveTextContent('Coming Soon'))
  })

  it('renders data & privacy actions as disabled, with the delete action styled as a warning', () => {
    renderPage()

    const downloadButton = screen.getByRole('button', { name: 'Download' })
    const deleteButton = screen.getByRole('button', { name: 'Delete Account' })

    expect(downloadButton).toBeDisabled()
    expect(deleteButton).toBeDisabled()
    expect(deleteButton.className).toContain('settings-button-danger')
  })

  it('renders the future settings info panel', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'More settings are on the way' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Calendar integrations')).toBeInTheDocument()
    expect(screen.getByText('Interest and skill preferences')).toBeInTheDocument()
  })

  it('shows a loading state while the profile is loading', () => {
    mockAuth({ isProfileLoading: true })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Loading your profile...' })).toBeInTheDocument()
  })

  it('shows the existing profile error state instead of the settings content', () => {
    mockAuth({ profileErrorMessage: 'Unable to load account profile' })

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Unable to load your profile' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Unable to load account profile')).toBeInTheDocument()
  })

  it('redirects organizations to the organization settings page', () => {
    mockAuth({
      userProfile: null,
      organizationProfile: {
        organizationId: 'org1',
        name: 'Seattle Food Bank',
        description: 'We distribute food to local families.',
        email: 'contact@seattlefoodbank.org',
        website: 'https://seattlefoodbank.org',
        profileImageUrl: null,
      },
    })

    const { container } = renderPage()

    expect(container).toBeEmptyDOMElement()
  })

  it('redirects home when there is no user profile', () => {
    mockAuth({ userProfile: null })

    const { container } = renderPage()

    expect(container).toBeEmptyDOMElement()
  })
})
