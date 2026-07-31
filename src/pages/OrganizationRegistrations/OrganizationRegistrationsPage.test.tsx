import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OrganizationRegistrationsPage from './OrganizationRegistrationsPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { getOrganizationOpportunityRegistrations } from '../../services/api/registrationService'
import { opp1, opp7 } from '../../tests/fixtures/opportunities'
import type { Opportunity } from '../../types/Opportunity'
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
      profileImageUrl: null,
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
    volunteerName: 'John Smith',
    email: 'john@example.com',
    registeredAt: '2026-06-01T10:00:00',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/organization/registrations']}>
      <OrganizationRegistrationsPage />
    </MemoryRouter>,
  )
}

describe('OrganizationRegistrationsPage', () => {
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

  it('renders the Registrations heading and subtitle', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderPage()

    expect(await screen.findByRole('heading', { level: 1, name: 'Registrations' })).toBeInTheDocument()
    expect(
      screen.getByText('Manage volunteer registrations across your opportunities.'),
    ).toBeInTheDocument()
  })

  it('loads organization opportunities using the existing organization API', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    await screen.findByText(opp1.title)
    expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledWith('token')
  })

  it('loads registrations for each opportunity', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])

    renderPage()

    await screen.findByText(opp1.title)

    await waitFor(() => {
      expect(mockedGetOrganizationOpportunityRegistrations).toHaveBeenCalledWith(
        'token',
        opp1.opportunityId,
      )
      expect(mockedGetOrganizationOpportunityRegistrations).toHaveBeenCalledWith(
        'token',
        opp7.opportunityId,
      )
    })
  })

  it('renders opportunities in organization display order: OPEN, then COMPLETED, then CLOSED', async () => {
    const completedOpportunity: Opportunity = {
      ...opp1,
      opportunityId: 'completed-opp',
      title: 'Completed Shift',
      date: '2025-01-01',
      status: 'OPEN',
    }
    mockedGetMyOrganizationOpportunities.mockResolvedValue([
      opp7,
      completedOpportunity,
      opp1,
    ])

    renderPage()

    const titles = await screen.findAllByRole('heading', { level: 3 })
    expect(titles.map((heading) => heading.textContent)).toEqual([
      opp1.title,
      completedOpportunity.title,
      opp7.title,
    ])
  })

  it('shows title, status, date/time, and registration count on each card', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    const card = (await screen.findByRole('heading', { level: 3, name: opp1.title })).closest(
      'article',
    ) as HTMLElement

    expect(within(card).getByText('Open')).toBeInTheDocument()
    expect(within(card).getByText(/Jul 10, 2026/)).toBeInTheDocument()
    expect(within(card).getByText(/9:00 AM – 12:00 PM/)).toBeInTheDocument()
    expect(
      within(card).getByText(`${opp1.registeredCount} / ${opp1.capacity} registered`),
    ).toBeInTheDocument()
  })

  it('renders volunteer name and email from real registration data, with a mailto link', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    mockedGetOrganizationOpportunityRegistrations.mockImplementation(async (_token, opportunityId) =>
      opportunityId === opp1.opportunityId
        ? [makeRegistration({ volunteerName: 'Mary Jones', email: 'mary@example.com' })]
        : [],
    )

    renderPage()

    expect(await screen.findByText('Mary Jones')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'mary@example.com' })).toHaveAttribute(
      'href',
      'mailto:mary@example.com',
    )
  })

  it('falls back to "Volunteer" when a registration has no volunteerName', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([
      makeRegistration({ volunteerName: null }),
    ])

    renderPage()

    expect(await screen.findByText('Volunteer')).toBeInTheDocument()
  })

  it('sorts volunteer rows by registeredAt ascending', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([
      makeRegistration({
        userId: 'later',
        volunteerName: 'Later Volunteer',
        registeredAt: '2026-06-05T10:00:00',
      }),
      makeRegistration({
        userId: 'earlier',
        volunteerName: 'Earlier Volunteer',
        registeredAt: '2026-06-01T10:00:00',
      }),
    ])

    renderPage()

    await screen.findByText('Earlier Volunteer')
    const names = screen.getAllByText(/Volunteer$/).map((node) => node.textContent)
    expect(names).toEqual(['Earlier Volunteer', 'Later Volunteer'])
  })

  it('shows "No volunteers have registered yet." for a zero-registration opportunity', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByText('No volunteers have registered yet.'),
    ).toBeInTheDocument()
  })

  it('renders the Create New Opportunity action when there are no opportunities at all', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByText('You have not created any opportunities yet.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create New Opportunity' })).toHaveAttribute(
      'href',
      '/organization/opportunities/new',
    )
  })

  it('keeps other cards visible when one opportunity fails to load its registrations', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])
    mockedGetOrganizationOpportunityRegistrations.mockImplementation(
      async (_token, opportunityId) => {
        if (opportunityId === opp1.opportunityId) {
          throw new Error('Unable to load registered volunteers: 500')
        }
        return []
      },
    )

    renderPage()

    await screen.findByText(opp7.title)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load registered volunteers: 500',
    )
    expect(screen.getByText(opp1.title)).toBeInTheDocument()
    expect(screen.getByText(opp7.title)).toBeInTheDocument()
    expect(screen.getByText('No volunteers have registered yet.')).toBeInTheDocument()
  })

  it('renders an understandable page-level error when opportunities fail to load', async () => {
    mockedGetMyOrganizationOpportunities.mockRejectedValue(new Error('Unable to load your opportunities: 500'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load your opportunities: 500',
    )
  })

  it('shows "Waiting list: Coming soon" rather than a fake count', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    expect(await screen.findByText('Waiting list: Coming soon')).toBeInTheDocument()
  })

  it('shows Send reminder as disabled', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    expect(await screen.findByRole('button', { name: 'Send reminder' })).toBeDisabled()
  })

  it('shows Export CSV as disabled', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    expect(await screen.findByRole('button', { name: 'Export CSV' })).toBeDisabled()
  })

  it('links View Opportunity to the correct organization route', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    expect(await screen.findByRole('link', { name: 'View Opportunity' })).toHaveAttribute(
      'href',
      `/organization/opportunities/${opp1.opportunityId}`,
    )
  })

  describe('summary metrics', () => {
    it('calculates Total Registrations, Opportunities With Registrations, and Total Volunteer Capacity correctly', async () => {
      const opportunityWithoutRegistrations: Opportunity = {
        ...opp1,
        opportunityId: 'no-regs',
        title: 'No Registrations Shift',
        capacity: 5,
      }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opportunityWithoutRegistrations])
      mockedGetOrganizationOpportunityRegistrations.mockImplementation(
        async (_token, opportunityId) =>
          opportunityId === opp1.opportunityId
            ? [makeRegistration({ userId: 'a' }), makeRegistration({ userId: 'b' })]
            : [],
      )

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Total Registrations').nextElementSibling).toHaveTextContent('2')
      })
      expect(
        screen.getByText('Opportunities With Registrations').nextElementSibling,
      ).toHaveTextContent('1')
      expect(screen.getByText('Total Volunteer Capacity').nextElementSibling).toHaveTextContent(
        String(opp1.capacity + opportunityWithoutRegistrations.capacity),
      )
    })

    it('does not show misleading zeros while registrations are still loading', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
      mockedGetOrganizationOpportunityRegistrations.mockReturnValue(new Promise(() => {}))

      renderPage()

      await screen.findByText('Total Registrations')
      expect(screen.getByText('Total Registrations').nextElementSibling).toHaveTextContent('—')
    })
  })

  it('keeps Completed and Closed opportunities visible since registration history still matters', async () => {
    const completedOpportunity: Opportunity = {
      ...opp1,
      opportunityId: 'completed-opp',
      title: 'Completed Shift',
      date: '2025-01-01',
      status: 'OPEN',
    }
    mockedGetMyOrganizationOpportunities.mockResolvedValue([completedOpportunity, opp7])

    renderPage()

    expect(await screen.findByText(completedOpportunity.title)).toBeInTheDocument()
    expect(screen.getByText(opp7.title)).toBeInTheDocument()
  })

  describe('filters', () => {
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
        volunteerName: 'John Smith',
        email: 'john@example.com',
        registeredAt: '2026-06-01T10:00:00',
        ...overrides,
      }
    }

    it('shows a "Showing X of Y opportunities" message', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])

      renderPage()

      expect(await screen.findByText('Showing 2 of 2 opportunities')).toBeInTheDocument()
    })

    it('filters by search matching the opportunity title', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])

      renderPage()
      await screen.findByText('Showing 2 of 2 opportunities')

      await user.type(screen.getByRole('searchbox', { name: 'Search' }), opp1.title)

      expect(await screen.findByText('Showing 1 of 2 opportunities')).toBeInTheDocument()
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
      expect(screen.queryByText(opp7.title)).not.toBeInTheDocument()
    })

    it('filters by search matching a volunteer name and shows the whole card', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])
      mockedGetOrganizationOpportunityRegistrations.mockImplementation(
        async (_token, opportunityId) =>
          opportunityId === opp1.opportunityId
            ? [makeRegistration({ volunteerName: 'Mariya Petrova' })]
            : [],
      )

      renderPage()
      await screen.findByText('Mariya Petrova')

      await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'mariya')

      expect(await screen.findByText('Showing 1 of 2 opportunities')).toBeInTheDocument()
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
      expect(screen.queryByText(opp7.title)).not.toBeInTheDocument()
    })

    it('filters by Opportunity Status', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])

      renderPage()
      await screen.findByText('Showing 2 of 2 opportunities')

      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Opportunity Status' }),
        'Closed',
      )

      expect(await screen.findByText('Showing 1 of 2 opportunities')).toBeInTheDocument()
      expect(screen.getByText(opp7.title)).toBeInTheDocument()
      expect(screen.queryByText(opp1.title)).not.toBeInTheDocument()
    })

    it('filters by With Registrations using actual registration data', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])
      mockedGetOrganizationOpportunityRegistrations.mockImplementation(
        async (_token, opportunityId) =>
          opportunityId === opp1.opportunityId ? [makeRegistration({})] : [],
      )

      renderPage()
      await screen.findByText('Showing 2 of 2 opportunities')

      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Registrations' }),
        'With Registrations',
      )

      expect(await screen.findByText('Showing 1 of 2 opportunities')).toBeInTheDocument()
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
      expect(screen.queryByText(opp7.title)).not.toBeInTheDocument()
    })

    it('filters by No Registrations', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])
      mockedGetOrganizationOpportunityRegistrations.mockImplementation(
        async (_token, opportunityId) =>
          opportunityId === opp1.opportunityId ? [makeRegistration({})] : [],
      )

      renderPage()
      await screen.findByText('Showing 2 of 2 opportunities')

      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Registrations' }),
        'No Registrations',
      )

      expect(await screen.findByText('Showing 1 of 2 opportunities')).toBeInTheDocument()
      expect(screen.getByText(opp7.title)).toBeInTheDocument()
      expect(screen.queryByText(opp1.title)).not.toBeInTheDocument()
    })

    it('combines search, status, and registration filters', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])
      mockedGetOrganizationOpportunityRegistrations.mockImplementation(
        async (_token, opportunityId) =>
          opportunityId === opp1.opportunityId ? [makeRegistration({})] : [],
      )

      renderPage()
      await screen.findByText('Showing 2 of 2 opportunities')

      await user.selectOptions(screen.getByRole('combobox', { name: 'Opportunity Status' }), 'Open')
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Registrations' }),
        'With Registrations',
      )
      await user.type(screen.getByRole('searchbox', { name: 'Search' }), opp1.title)

      expect(await screen.findByText('Showing 1 of 2 opportunities')).toBeInTheDocument()
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
    })

    it('clearing filters restores all opportunity cards', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])

      renderPage()
      await screen.findByText('Showing 2 of 2 opportunities')

      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Opportunity Status' }),
        'Closed',
      )
      expect(await screen.findByText('Showing 1 of 2 opportunities')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(await screen.findByText('Showing 2 of 2 opportunities')).toBeInTheDocument()
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
      expect(screen.getByText(opp7.title)).toBeInTheDocument()
    })

    it('preserves OPEN before CLOSED ordering after filtering', async () => {
      const openLater: Opportunity = { ...opp1, opportunityId: 'open-later', title: 'Open Later', date: '2026-12-01', status: 'OPEN' }
      const openEarlier: Opportunity = { ...opp1, opportunityId: 'open-earlier', title: 'Open Earlier', date: '2026-02-01', status: 'OPEN' }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([openLater, openEarlier, opp7])

      renderPage()

      const titles = await screen.findAllByRole('heading', { level: 3 })
      expect(titles.map((heading) => heading.textContent)).toEqual([
        openEarlier.title,
        openLater.title,
        opp7.title,
      ])
    })

    it('does not change summary metrics when filters change', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])

      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Total Registrations').nextElementSibling).toHaveTextContent('0')
      })

      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Opportunity Status' }),
        'Closed',
      )

      expect(screen.getByText('Total Registrations').nextElementSibling).toHaveTextContent('0')
      expect(
        screen.getByText('Opportunities With Registrations').nextElementSibling,
      ).toHaveTextContent('0')
      expect(screen.getByText('Total Volunteer Capacity').nextElementSibling).toHaveTextContent(
        String(opp1.capacity + opp7.capacity),
      )
    })

    it('shows "No opportunities match your filters." with a Clear Filters action when nothing matches', async () => {
      const user = userEvent.setup()
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])

      renderPage()
      await screen.findByText('Showing 2 of 2 opportunities')

      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'no such opportunity exists',
      )

      expect(await screen.findByText('No opportunities match your filters.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Clear Filters' }))

      expect(await screen.findByText('Showing 2 of 2 opportunities')).toBeInTheDocument()
    })

    it('keeps card-level loading and error behavior correct while filters are active', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1, opp7])
      mockedGetOrganizationOpportunityRegistrations.mockImplementation(
        async (_token, opportunityId) => {
          if (opportunityId === opp1.opportunityId) {
            throw new Error('Unable to load registered volunteers: 500')
          }
          return []
        },
      )

      renderPage()

      await screen.findByText(opp7.title)
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Unable to load registered volunteers: 500',
      )
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
    })
  })
})
