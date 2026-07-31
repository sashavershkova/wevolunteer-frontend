import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrganizationProfilePage from './OrganizationProfilePage'
import { useAppAuth } from '../../contexts/AuthContext'
import { updateCurrentOrganization } from '../../services/api/organizationService'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/organizationService', () => ({
  updateCurrentOrganization: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)

const organizationFixture = {
  organizationId: 'org1',
  name: 'Seattle Food Bank',
  description: '',
  email: 'contact@seattlefoodbank.org',
  website: '',
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
    <MemoryRouter initialEntries={['/organization/profile']}>
      <OrganizationProfilePage />
    </MemoryRouter>,
  )
}

describe('OrganizationProfilePage', () => {
  beforeEach(() => {
    vi.mocked(updateCurrentOrganization).mockReset()
    mockAuth()
  })

  it('renders the organization name as the page heading', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: organizationFixture.name }),
    ).toBeInTheDocument()
  })

  it('renders the real profile fields from the existing profile card', () => {
    renderPage()

    expect(screen.getByText(organizationFixture.email)).toBeInTheDocument()
  })

  it('redirects home when there is no organization profile', () => {
    mockAuth({ organizationProfile: null })

    const { container } = renderPage()

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the mission fallback when the description is blank', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Mission & About' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Add a description to tell volunteers about your organization’s mission and community impact.',
      ),
    ).toBeInTheDocument()
  })

  it('uses the real description in Mission & About when present', () => {
    mockAuth({
      organizationProfile: { ...organizationFixture, description: 'We feed our community.' },
    })

    renderPage()

    expect(screen.getAllByText('We feed our community.').length).toBeGreaterThan(0)
  })

  it('renders Organization Details with future fields, not invented facts', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Organization Details' })).toBeInTheDocument()
    expect(screen.getAllByText('Not configured').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Community nonprofit/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Seattle$/)).not.toBeInTheDocument()
  })

  it('renders Verification & Trust without claiming the organization is verified', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Verification & Trust' })).toBeInTheDocument()
    expect(
      screen.getByText('Verification status managed by account authentication'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/^Verified$/)).not.toBeInTheDocument()
  })

  it('distinguishes real populated fields from planned fields in Complete Your Profile', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Complete Your Profile' })).toBeInTheDocument()
    expect(screen.getAllByText('Complete').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0)
  })

  it('renders Planned Profile Features as noninteractive content', () => {
    renderPage()

    const heading = screen.getByRole('heading', { name: 'Planned Profile Features' })
    const section = heading.closest('section')
    expect(section).not.toBeNull()

    const sectionScope = within(section as HTMLElement)
    expect(sectionScope.queryAllByRole('link')).toHaveLength(0)
    expect(sectionScope.queryAllByRole('button')).toHaveLength(0)
  })

  it('does not add Dashboard metrics, registration totals, or volunteer counts', () => {
    renderPage()

    expect(screen.queryByText('Open Opportunities')).not.toBeInTheDocument()
    expect(screen.queryByText('Total Registrations')).not.toBeInTheDocument()
    expect(screen.queryByText(/registrations$/i)).not.toBeInTheDocument()
  })
})
