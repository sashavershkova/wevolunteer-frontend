import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OrganizationVolunteersPage from './OrganizationVolunteersPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { getOrganizationOpportunityRegistrations } from '../../services/api/registrationService'
import { opp1, opp3 } from '../../tests/fixtures/opportunities'
import type { Registration } from '../../services/api/registrationService'

const MOCKED_TODAY = '2026-01-01T00:00:00'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/organizationService', () => ({
  getMyOrganizationOpportunities: vi.fn(),
}))

vi.mock('../../services/api/registrationService', () => ({
  getOrganizationOpportunityRegistrations: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyOrganizationOpportunities = vi.mocked(getMyOrganizationOpportunities)
const mockedGetOrganizationOpportunityRegistrations = vi.mocked(
  getOrganizationOpportunityRegistrations,
)

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
    profileErrorMessage: null,
    updateUserProfile: vi.fn(),
    updateOrganizationProfile: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    ...overrides,
  })
}

function makeRegistration(overrides: Partial<Registration>): Registration {
  return {
    userId: 'user-1',
    opportunityId: opp1.opportunityId,
    title: opp1.title,
    date: opp1.date,
    location: opp1.location,
    organizationId: opp1.organizationId,
    organizationName: opp1.organizationName,
    registrationStatus: 'ACTIVE',
    volunteerName: 'Mariya Mokrynska',
    email: 'mariya@example.com',
    registeredAt: '2026-06-01T10:00:00',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/organization/volunteers']}>
      <OrganizationVolunteersPage />
    </MemoryRouter>,
  )
}

describe('OrganizationVolunteersPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetMyOrganizationOpportunities.mockReset()
    mockedGetOrganizationOpportunityRegistrations.mockReset()
    mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([])
    mockAuth()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the Volunteers heading and subtitle', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderPage()

    expect(await screen.findByRole('heading', { level: 1, name: 'Volunteers' })).toBeInTheDocument()
    expect(
      screen.getByText('A directory of volunteers who have registered for your opportunities.'),
    ).toBeInTheDocument()
  })

  it('shows metric placeholders while opportunities are still loading', () => {
    mockedGetMyOrganizationOpportunities.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('Loading your opportunities...')
  })

  it('shows metric placeholders while registrations are still settling (no misleading zeros)', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    mockedGetOrganizationOpportunityRegistrations.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(
      await screen.findByText('Loading volunteer directory...'),
    ).toBeInTheDocument()
  })

  it('deduplicates a volunteer who registered for multiple opportunities into one card', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp3])
    mockedGetOrganizationOpportunityRegistrations.mockImplementation(async (_token, opportunityId) => [
      makeRegistration({ userId: 'user-1', opportunityId }),
    ])

    renderPage()

    await screen.findByText('Mariya Mokrynska')
    expect(screen.getAllByText('Mariya Mokrynska')).toHaveLength(1)
  })

  it('calculates summary metrics correctly', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp3])
    mockedGetOrganizationOpportunityRegistrations.mockImplementation(
      async (_token, opportunityId) => {
        if (opportunityId === opp1.opportunityId) {
          return [
            makeRegistration({ userId: 'user-1', opportunityId, volunteerName: 'Returning Person' }),
          ]
        }
        return [
          makeRegistration({ userId: 'user-1', opportunityId, volunteerName: 'Returning Person' }),
          makeRegistration({ userId: 'user-2', opportunityId, volunteerName: 'New Person', email: 'new@example.com' }),
        ]
      },
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Total Volunteers').nextElementSibling).toHaveTextContent('2')
    })
    expect(screen.getByText('New Volunteers').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Returning Volunteers').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Frequent Volunteers').nextElementSibling).toHaveTextContent('0')
  })

  it('shows name, email, avatar, status, counts, and dates for a volunteer', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp3])
    mockedGetOrganizationOpportunityRegistrations.mockImplementation(async (_token, opportunityId) => [
      makeRegistration({
        userId: 'user-1',
        opportunityId,
        volunteerName: 'Mariya Mokrynska',
        email: 'mariya@example.com',
        registeredAt: opportunityId === opp1.opportunityId ? '2026-06-01T10:00:00' : '2026-06-15T10:00:00',
      }),
    ])

    renderPage()

    await screen.findByText('Mariya Mokrynska')
    const card = screen.getByText('Mariya Mokrynska').closest('article') as HTMLElement
    expect(within(card).getByText('M')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'mariya@example.com' })).toHaveAttribute(
      'href',
      'mailto:mariya@example.com',
    )
    expect(within(card).getByText('Returning Volunteer')).toBeInTheDocument()
    expect(within(card).getByText('2 registrations')).toBeInTheDocument()
    expect(within(card).getByText('First registered Jun 1, 2026')).toBeInTheDocument()
    expect(within(card).getByText('Most recent Jun 15, 2026')).toBeInTheDocument()
  })

  it('does not display a raw userId anywhere', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([
      makeRegistration({ userId: 'user-abc-123' }),
    ])

    renderPage()

    await screen.findByText('Mariya Mokrynska')
    expect(screen.queryByText('user-abc-123')).not.toBeInTheDocument()
  })

  it('shows the no-volunteers state with a View My Opportunities link', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByText('No volunteers have registered for your opportunities yet.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View My Opportunities' })).toHaveAttribute(
      'href',
      '/organization/opportunities',
    )
  })

  it('shows a page-level error when opportunities fail to load', async () => {
    mockedGetMyOrganizationOpportunities.mockRejectedValue(
      new Error('Unable to load your opportunities: 500'),
    )

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load your opportunities: 500',
    )
  })

  it('preserves volunteers from successful requests and shows a partial-data warning when one opportunity fails', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp3])
    mockedGetOrganizationOpportunityRegistrations.mockImplementation(
      async (_token, opportunityId) => {
        if (opportunityId === opp1.opportunityId) {
          throw new Error('Unable to load registered volunteers: 500')
        }
        return [makeRegistration({ userId: 'user-2', opportunityId, volunteerName: 'Still Visible' })]
      },
    )

    renderPage()

    expect(await screen.findByText('Still Visible')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Some volunteer registration data could not be loaded. The directory may be incomplete.',
      ),
    ).toBeInTheDocument()
  })

  it('does not classify a failed opportunity as zero registrations for the failing volunteer', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    mockedGetOrganizationOpportunityRegistrations.mockRejectedValue(
      new Error('Unable to load registered volunteers: 500'),
    )

    renderPage()

    await screen.findByText(
      'Some volunteer registration data could not be loaded. The directory may be incomplete.',
    )
    expect(
      screen.queryByText('No volunteers have registered for your opportunities yet.'),
    ).not.toBeInTheDocument()
  })

  describe('filters', () => {
    it('updates the filtered-results count', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp3])
      mockedGetOrganizationOpportunityRegistrations.mockImplementation(
        async (_token, opportunityId) => [
          makeRegistration({
            userId: opportunityId === opp1.opportunityId ? 'user-1' : 'user-2',
            opportunityId,
            volunteerName: opportunityId === opp1.opportunityId ? 'Alice' : 'Bob',
          }),
        ],
      )

      renderPage()
      expect(await screen.findByText('Showing 2 of 2 volunteers')).toBeInTheDocument()

      await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Alice')

      expect(await screen.findByText('Showing 1 of 2 volunteers')).toBeInTheDocument()
    })

    it('shows a no-match state with Clear Filters', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
      mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([makeRegistration({})])

      renderPage()
      await screen.findByText('Showing 1 of 1 volunteers')

      await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'nobody matches this')

      expect(await screen.findByText('No volunteers match your filters.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Clear Filters' }))

      expect(await screen.findByText('Showing 1 of 1 volunteers')).toBeInTheDocument()
    })

    it('does not trigger additional API requests when filters change', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
      mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([makeRegistration({})])

      renderPage()
      await screen.findByText('Showing 1 of 1 volunteers')

      const callCountBeforeFiltering = mockedGetOrganizationOpportunityRegistrations.mock.calls.length
      expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledTimes(1)

      await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Mariya')
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Volunteer Status' }),
        'New Volunteer',
      )

      expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledTimes(1)
      expect(mockedGetOrganizationOpportunityRegistrations).toHaveBeenCalledTimes(
        callCountBeforeFiltering,
      )
    })
  })
})
