import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('redirects home when there is no organization profile', () => {
    mockAuth({ organizationProfile: null })

    const { container } = renderPage()

    expect(container).toBeEmptyDOMElement()
  })
})
