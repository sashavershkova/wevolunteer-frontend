import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrganizationDashboardPage from './OrganizationDashboardPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { opp1 } from '../../tests/fixtures/opportunities'
import type { Opportunity } from '../../types/Opportunity'

// opp1's date (2026-07-10) is fixed in the future relative to this mocked "today", so it
// exercises future-opportunity behavior deterministically regardless of when tests run.
const MOCKED_TODAY = '2026-01-01T00:00:00'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/organizationService', () => ({
  getMyOrganizationOpportunities: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyOrganizationOpportunities = vi.mocked(getMyOrganizationOpportunities)

const organizationFixture = {
  organizationId: 'org1',
  name: 'Seattle Food Bank',
  description: 'We distribute food to local families.',
  email: 'contact@seattlefoodbank.org',
  website: '',
  profileImageUrl: null,
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
    <MemoryRouter initialEntries={['/organization']}>
      <OrganizationDashboardPage />
    </MemoryRouter>,
  )
}

function getMetricValue(label: string): string {
  const card = screen.getByText(label).closest('.metric-card')
  return within(card as HTMLElement).getByText(/^(—|\d+)$/).textContent ?? ''
}

describe('OrganizationDashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetMyOrganizationOpportunities.mockReset()
    mockAuth()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a welcome heading using the organization name', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: `Welcome back, ${organizationFixture.name}`,
      }),
    ).toBeInTheDocument()
  })

  it('renders four metric cards', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderPage()

    await screen.findByText('Open Opportunities')
    expect(screen.getByText('Open Opportunities')).toBeInTheDocument()
    expect(screen.getByText('Upcoming (30 days)')).toBeInTheDocument()
    expect(screen.getByText('Total Registrations')).toBeInTheDocument()
    expect(screen.getByText('Total Capacity')).toBeInTheDocument()
  })

  it('shows placeholders for all metrics while opportunities are loading', () => {
    mockedGetMyOrganizationOpportunities.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(getMetricValue('Open Opportunities')).toBe('—')
    expect(getMetricValue('Upcoming (30 days)')).toBe('—')
    expect(getMetricValue('Total Registrations')).toBe('—')
    expect(getMetricValue('Total Capacity')).toBe('—')
  })

  describe('Open Opportunities metric', () => {
    it('counts a future OPEN opportunity as Open', async () => {
      const futureOpen: Opportunity = { ...opp1, date: '2026-08-01', status: 'OPEN' }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureOpen])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Open Opportunities')).toBe('1')
      })
    })

    it('does not count a past OPEN opportunity as Open (it is Completed)', async () => {
      const pastOpen: Opportunity = { ...opp1, date: '2025-06-01', status: 'OPEN' }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([pastOpen])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Total Registrations')).toBe(String(pastOpen.registeredCount))
      })
      expect(getMetricValue('Open Opportunities')).toBe('0')
    })

    it('does not count a CLOSED opportunity as Open', async () => {
      const closed: Opportunity = { ...opp1, date: '2026-08-01', status: 'CLOSED' }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closed])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Total Registrations')).toBe(String(closed.registeredCount))
      })
      expect(getMetricValue('Open Opportunities')).toBe('0')
    })
  })

  describe('Total Registrations and Total Capacity metrics', () => {
    it('sums registeredCount and capacity across every opportunity regardless of status', async () => {
      const open: Opportunity = {
        ...opp1,
        opportunityId: 'open',
        date: '2026-08-01',
        status: 'OPEN',
        registeredCount: 3,
        capacity: 10,
      }
      const closed: Opportunity = {
        ...opp1,
        opportunityId: 'closed',
        date: '2026-08-01',
        status: 'CLOSED',
        registeredCount: 5,
        capacity: 8,
      }
      const pastOpen: Opportunity = {
        ...opp1,
        opportunityId: 'past-open',
        date: '2025-06-01',
        status: 'OPEN',
        registeredCount: 7,
        capacity: 20,
      }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([open, closed, pastOpen])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Total Registrations')).toBe('15')
      })
      expect(getMetricValue('Total Capacity')).toBe('38')
    })
  })

  describe('Upcoming Opportunities section', () => {
    it('shows only OPEN opportunities, ordered chronologically', async () => {
      const later: Opportunity = {
        ...opp1,
        opportunityId: 'later',
        title: 'Later Shift',
        date: '2026-08-01',
        status: 'OPEN',
      }
      const earlier: Opportunity = {
        ...opp1,
        opportunityId: 'earlier',
        title: 'Earlier Shift',
        date: '2026-07-01',
        status: 'OPEN',
      }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([later, earlier])

      renderPage()

      const titles = await screen.findAllByRole('link', { name: /Shift/ })
      expect(titles.map((link) => link.textContent)).toEqual(['Earlier Shift', 'Later Shift'])
    })

    it('excludes Completed (past OPEN) opportunities', async () => {
      const upcoming: Opportunity = {
        ...opp1,
        opportunityId: 'upcoming',
        title: 'Upcoming Shift',
        date: '2026-07-01',
        status: 'OPEN',
      }
      const completed: Opportunity = {
        ...opp1,
        opportunityId: 'completed',
        title: 'Completed Shift',
        date: '2025-01-01',
        status: 'OPEN',
      }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([upcoming, completed])

      renderPage()

      expect(await screen.findByText('Upcoming Shift')).toBeInTheDocument()
      expect(screen.queryByText('Completed Shift')).not.toBeInTheDocument()
    })

    it('excludes CLOSED opportunities', async () => {
      const upcoming: Opportunity = {
        ...opp1,
        opportunityId: 'upcoming',
        title: 'Upcoming Shift',
        date: '2026-07-01',
        status: 'OPEN',
      }
      const closed: Opportunity = {
        ...opp1,
        opportunityId: 'closed',
        title: 'Closed Shift',
        date: '2026-07-05',
        status: 'CLOSED',
      }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([upcoming, closed])

      renderPage()

      expect(await screen.findByText('Upcoming Shift')).toBeInTheDocument()
      expect(screen.queryByText('Closed Shift')).not.toBeInTheDocument()
    })

    it('shows only the first 3 upcoming opportunities', async () => {
      const opportunities = [1, 2, 3, 4].map((day) => ({
        ...opp1,
        opportunityId: `opp-${day}`,
        title: `Shift ${day}`,
        date: `2026-07-0${day}`,
        status: 'OPEN' as const,
      }))
      mockedGetMyOrganizationOpportunities.mockResolvedValue(opportunities)

      renderPage()

      await screen.findByText('Shift 1')
      expect(screen.getByText('Shift 2')).toBeInTheDocument()
      expect(screen.getByText('Shift 3')).toBeInTheDocument()
      expect(screen.queryByText('Shift 4')).not.toBeInTheDocument()
    })

    it('shows an empty state when there are no upcoming opportunities', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()

      expect(
        await screen.findByText('You have no upcoming opportunities.'),
      ).toBeInTheDocument()
    })

    it('links "View all opportunities" to the dedicated My Opportunities page', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()

      expect(
        await screen.findByRole('link', { name: 'View all opportunities' }),
      ).toHaveAttribute('href', '/organization/opportunities')
    })
  })

  describe('Quick Actions', () => {
    it('links to the existing routes for each quick action', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()
      await screen.findByText('Quick Actions')

      expect(screen.getByRole('link', { name: '+ Create New Opportunity' })).toHaveAttribute(
        'href',
        '/organization/opportunities/new',
      )
      expect(screen.getByRole('link', { name: /View All Opportunities/ })).toHaveAttribute(
        'href',
        '/organization/opportunities',
      )
      expect(screen.getByRole('link', { name: /View Registrations/ })).toHaveAttribute(
        'href',
        '/organization/registrations',
      )
      expect(screen.getByRole('link', { name: /View Volunteers/ })).toHaveAttribute(
        'href',
        '/organization/volunteers',
      )
      expect(screen.getByRole('link', { name: /View Organization Profile/ })).toHaveAttribute(
        'href',
        '/organization/profile',
      )
    })
  })

  describe('removed duplicated content', () => {
    it('does not render the full My Opportunities management table', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

      renderPage()

      await screen.findByText(`Welcome back, ${organizationFixture.name}`)
      expect(
        screen.queryByRole('heading', { level: 2, name: 'My Opportunities' }),
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('does not render Close/Delete management actions', async () => {
      const open: Opportunity = { ...opp1, date: '2026-08-01', status: 'OPEN' }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([open])

      renderPage()

      await screen.findByText(opp1.title)
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    })

    it('does not render the full organization profile block', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()

      await screen.findByText(`Welcome back, ${organizationFixture.name}`)
      expect(screen.queryByText(organizationFixture.description)).not.toBeInTheDocument()
      expect(screen.queryByText(organizationFixture.email)).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Edit organization information' }),
      ).not.toBeInTheDocument()
    })

    it('does not render a generic Coming Soon section', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()

      await screen.findByText(`Welcome back, ${organizationFixture.name}`)
      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
    })
  })
})
