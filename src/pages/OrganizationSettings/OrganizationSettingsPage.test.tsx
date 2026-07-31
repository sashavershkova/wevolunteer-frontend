import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrganizationSettingsPage from './OrganizationSettingsPage'
import { useAppAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)

const organizationFixture = {
  organizationId: 'org1',
  name: 'Seattle Food Bank',
  description: 'We distribute food to local families.',
  email: 'contact@seattlefoodbank.org',
  website: 'https://seattlefoodbank.org',
}

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'org@example.com',
    userId: 'org1',
    accessToken: 'token',
    userProfile: null,
    organizationProfile: organizationFixture,
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
    <MemoryRouter initialEntries={['/organization/settings']}>
      <OrganizationSettingsPage />
    </MemoryRouter>,
  )
}

describe('OrganizationSettingsPage', () => {
  beforeEach(() => {
    mockAuth()
  })

  it('renders the page heading and subtitle', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(
      screen.getByText("Manage your organization’s account, team, and preferences."),
    ).toBeInTheDocument()
  })

  it('shows the real organization name, email, and website from AuthContext', () => {
    renderPage()

    expect(screen.getByText(organizationFixture.name)).toBeInTheDocument()
    expect(screen.getByText(organizationFixture.email)).toBeInTheDocument()
    expect(screen.getByText(organizationFixture.website)).toBeInTheDocument()
  })

  it('shows a "Not provided" placeholder when the website is blank', () => {
    mockAuth({ organizationProfile: { ...organizationFixture, website: '' } })

    renderPage()

    expect(screen.getByText('Not provided')).toBeInTheDocument()
  })

  it('links to the Organization Profile page without duplicating the editor', () => {
    renderPage()

    const link = screen.getByRole('link', { name: 'View Organization Profile' })
    expect(link).toHaveAttribute('href', '/organization/profile')
    expect(screen.queryByRole('button', { name: 'Edit organization information' })).not
      .toBeInTheDocument()
  })

  it('shows Team Members and Roles & Permissions as disabled, with a Coming Soon badge', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Team Members' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Roles & Permissions' })).toBeInTheDocument()
    expect(screen.getAllByText('Coming Soon').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Manage Team' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Manage Roles' })).toBeDisabled()
  })

  it('renders all three notification toggles as disabled checkboxes', () => {
    renderPage()

    expect(screen.getByRole('checkbox', { name: 'Email notifications' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Opportunity reminders' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Weekly summary' })).toBeDisabled()
    expect(
      screen.getByText('Notification preferences will become available in a future update.'),
    ).toBeInTheDocument()
  })

  it('renders integration tiles with disabled actions', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Google Calendar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Slack' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'CSV Export' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
  })

  it('describes password management via Cognito and marks 2FA/session management as coming soon', () => {
    renderPage()

    expect(screen.getByText('Managed through Amazon Cognito.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manage Password' })).toBeDisabled()
    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument()
    expect(screen.getByText('Session management')).toBeInTheDocument()
    expect(screen.getAllByText('Coming Soon').length).toBeGreaterThanOrEqual(2)
  })

  it('marks every non-functional block with a Coming Soon badge', () => {
    const { container } = renderPage()

    // Team Members, Roles & Permissions, Notifications, Integrations, Security,
    // Data & Privacy -- every block except the real Organization Information
    // section.
    const badges = container.querySelectorAll('.organization-settings-badge')
    expect(badges).toHaveLength(6)
    badges.forEach((badge) => expect(badge).toHaveTextContent('Coming Soon'))
  })

  it('renders data & privacy actions as disabled, with the delete action styled as a warning', () => {
    renderPage()

    const downloadButton = screen.getByRole('button', { name: 'Download' })
    const deleteButton = screen.getByRole('button', { name: 'Delete Account' })

    expect(downloadButton).toBeDisabled()
    expect(deleteButton).toBeDisabled()
    expect(deleteButton.className).toContain('organization-settings-button-danger')
  })

  it('renders the future settings info panel', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'More settings are on the way' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Team collaboration')).toBeInTheDocument()
    expect(screen.getByText('Organization verification')).toBeInTheDocument()
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

  it('redirects home when there is no organization profile', () => {
    mockAuth({ organizationProfile: null })

    const { container } = renderPage()

    expect(container).toBeEmptyDOMElement()
  })
})
