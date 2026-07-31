import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrganizationOpportunitiesPage from './OrganizationOpportunitiesPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/organizationService', () => ({
  getMyOrganizationOpportunities: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyOrganizationOpportunities = vi.mocked(getMyOrganizationOpportunities)

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'org@example.com',
    userId: 'org1',
    accessToken: 'token',
    userProfile: null,
    organizationProfile: {
      organizationId: 'org1',
      name: 'Seattle Food Bank',
      description: '',
      email: 'contact@seattlefoodbank.org',
      website: '',
    },
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
    <MemoryRouter initialEntries={['/organization/opportunities']}>
      <OrganizationOpportunitiesPage />
    </MemoryRouter>,
  )
}

describe('OrganizationOpportunitiesPage', () => {
  beforeEach(() => {
    mockedGetMyOrganizationOpportunities.mockReset()
    mockAuth()
  })

  it('renders the My Opportunities section as the page heading', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'My Opportunities' }),
    ).toBeInTheDocument()
  })

  it('redirects home when there is no organization profile', () => {
    mockAuth({ organizationProfile: null })

    const { container } = renderPage()

    expect(container).toBeEmptyDOMElement()
  })
})
