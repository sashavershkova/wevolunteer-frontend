import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrganizationOpportunityDetailsPage from './OrganizationOpportunityDetailsPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getOpportunity } from '../../services/api/opportunityService'
import { opp1 } from '../../tests/fixtures/opportunities'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  getOpportunity: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetOpportunity = vi.mocked(getOpportunity)

const organizationFixture = {
  organizationId: 'org1',
  name: 'Seattle Food Bank',
  description: 'We distribute food to local families.',
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
    accessToken: 'test-token',
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

function renderPage(initialEntry = `/organization/opportunities/${opp1.opportunityId}`) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/organization/opportunities/:opportunityId"
          element={<OrganizationOpportunityDetailsPage />}
        />
        <Route path="/organization" element={<div>Organization Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderPageWithoutOpportunityId() {
  return render(
    <MemoryRouter>
      <OrganizationOpportunityDetailsPage />
    </MemoryRouter>,
  )
}

describe('OrganizationOpportunityDetailsPage', () => {
  beforeEach(() => {
    mockedGetOpportunity.mockReset()
    mockAuth()
  })

  it('shows a loading state while the opportunity is being fetched', () => {
    mockedGetOpportunity.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading opportunity...')
  })

  it('displays the loaded opportunity information', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    expect(await screen.findByRole('heading', { name: opp1.title })).toBeInTheDocument()
    expect(screen.getByText(opp1.description)).toBeInTheDocument()
    expect(screen.getByText(opp1.category)).toBeInTheDocument()
    expect(screen.getByText(opp1.location)).toBeInTheDocument()
    expect(screen.getByText(opp1.time as string)).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(mockedGetOpportunity).toHaveBeenCalledWith('test-token', opp1.opportunityId)
  })

  it('shows capacity, registered count, and available spots', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    await screen.findByRole('heading', { name: opp1.title })

    expect(screen.getByText('Capacity').closest('div')).toHaveTextContent(String(opp1.capacity))
    expect(screen.getByText('Registered').closest('div')).toHaveTextContent(
      String(opp1.registeredCount),
    )
    expect(screen.getByText('Available Spots').closest('div')).toHaveTextContent(
      String(opp1.availableSpots),
    )
  })

  it('links the Edit control to the edit page with an accessible label', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    const editLink = await screen.findByRole('link', { name: `Edit ${opp1.title}` })
    expect(editLink).toHaveAttribute(
      'href',
      `/organization/opportunities/${opp1.opportunityId}/edit`,
    )
  })

  it('shows a registered-volunteers placeholder section', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Registered Volunteers' })).toBeInTheDocument()
    expect(
      screen.getByText('Volunteer registration management will be added in a future update.'),
    ).toBeInTheDocument()
  })

  it('shows an error when loading the opportunity fails', async () => {
    mockedGetOpportunity.mockRejectedValue(new Error('Unable to load opportunity: 500'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load opportunity: 500',
    )
  })

  it('shows an error when the opportunity cannot be found', async () => {
    mockedGetOpportunity.mockResolvedValue(null)

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This opportunity could not be found.',
    )
  })

  it('shows an error and does not attempt to load when no opportunity ID is present', () => {
    renderPageWithoutOpportunityId()

    expect(screen.getByRole('alert')).toHaveTextContent('No opportunity was specified.')
    expect(mockedGetOpportunity).not.toHaveBeenCalled()
  })

  it('hides the details and shows a message when the organization does not own the opportunity', async () => {
    mockAuth({
      organizationProfile: { ...organizationFixture, organizationId: 'org-other' },
    })
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    expect(
      await screen.findByText('Your organization cannot view this opportunity.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: opp1.title })).not.toBeInTheDocument()
  })
})
