import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrganizationDashboardPage from './OrganizationDashboardPage'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getMyOrganizationOpportunities,
  updateCurrentOrganization,
} from '../../services/api/organizationService'
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
  updateCurrentOrganization: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  closeOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyOrganizationOpportunities = vi.mocked(getMyOrganizationOpportunities)
const mockedUpdateCurrentOrganization = vi.mocked(updateCurrentOrganization)

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
    <MemoryRouter initialEntries={['/organization']}>
      <OrganizationDashboardPage />
    </MemoryRouter>,
  )
}

function getMetricValue(label: string): string {
  const card = screen.getByText(label).closest('.organization-dashboard-metric-card')
  return within(card as HTMLElement).getByText(/^(—|\d+)$/).textContent ?? ''
}

describe('OrganizationDashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetMyOrganizationOpportunities.mockReset()
    mockedUpdateCurrentOrganization.mockReset()
    mockAuth()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads organization opportunities using the existing service and reflects them in the metrics', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    await waitFor(() => {
      expect(getMetricValue('Active Opportunities')).toBe('1')
    })
    expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledWith('token')
  })

  it('also shows the My Opportunities table below the profile overview', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    expect(
      await screen.findByRole('heading', { level: 2, name: 'My Opportunities' }),
    ).toBeInTheDocument()
    expect(screen.getByText(opp1.title)).toBeInTheDocument()
  })

  describe('opportunity lifecycle metrics', () => {
    const futureOpen: Opportunity = { ...opp1, opportunityId: 'future-open', date: '2026-08-01', status: 'OPEN' }
    const futureClosed: Opportunity = { ...opp1, opportunityId: 'future-closed', date: '2026-08-01', status: 'CLOSED' }
    const pastOpen: Opportunity = { ...opp1, opportunityId: 'past-open', date: '2025-06-01', status: 'OPEN' }
    const pastClosed: Opportunity = { ...opp1, opportunityId: 'past-closed', date: '2025-06-01', status: 'CLOSED' }

    it('counts a future OPEN opportunity only in Active', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureOpen])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Active Opportunities')).toBe('1')
      })
      expect(getMetricValue('Closed Opportunities')).toBe('0')
      expect(getMetricValue('Completed Opportunities')).toBe('0')
    })

    it('counts a future CLOSED opportunity only in Closed', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureClosed])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Closed Opportunities')).toBe('1')
      })
      expect(getMetricValue('Active Opportunities')).toBe('0')
      expect(getMetricValue('Completed Opportunities')).toBe('0')
    })

    it('counts a past OPEN opportunity only in Completed', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([pastOpen])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Completed Opportunities')).toBe('1')
      })
      expect(getMetricValue('Active Opportunities')).toBe('0')
      expect(getMetricValue('Closed Opportunities')).toBe('0')
    })

    it('counts a past CLOSED opportunity only in Completed', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([pastClosed])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Completed Opportunities')).toBe('1')
      })
      expect(getMetricValue('Active Opportunities')).toBe('0')
      expect(getMetricValue('Closed Opportunities')).toBe('0')
    })

    it('produces correct totals for a mix of future and past, open and closed opportunities', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([
        { ...futureOpen, title: 'Future Open Shift' },
        { ...futureClosed, title: 'Future Closed Shift' },
        { ...pastOpen, title: 'Past Open Shift' },
        { ...pastClosed, title: 'Past Closed Shift' },
      ])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Active Opportunities')).toBe('1')
      })
      expect(getMetricValue('Closed Opportunities')).toBe('1')
      expect(getMetricValue('Completed Opportunities')).toBe('2')
    })
  })

  describe('active registrations and capacity metrics', () => {
    const futureOpen: Opportunity = {
      ...opp1,
      opportunityId: 'future-open',
      date: '2026-08-01',
      status: 'OPEN',
      registeredCount: 3,
      capacity: 10,
    }
    const futureClosed: Opportunity = {
      ...opp1,
      opportunityId: 'future-closed',
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
    const pastClosed: Opportunity = {
      ...opp1,
      opportunityId: 'past-closed',
      date: '2025-06-01',
      status: 'CLOSED',
      registeredCount: 11,
      capacity: 30,
    }

    it('includes a future OPEN opportunity in Active Registrations and Active Capacity', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureOpen])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Active Registrations')).toBe('3')
      })
      expect(getMetricValue('Active Capacity')).toBe('10')
    })

    it('includes a future CLOSED opportunity in Active Registrations and Active Capacity', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureClosed])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Active Registrations')).toBe('5')
      })
      expect(getMetricValue('Active Capacity')).toBe('8')
    })

    it('excludes a past OPEN opportunity from Active Registrations and Active Capacity', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([pastOpen])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Completed Opportunities')).toBe('1')
      })
      expect(getMetricValue('Active Registrations')).toBe('0')
      expect(getMetricValue('Active Capacity')).toBe('0')
    })

    it('excludes a past CLOSED opportunity from Active Registrations and Active Capacity', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([pastClosed])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Completed Opportunities')).toBe('1')
      })
      expect(getMetricValue('Active Registrations')).toBe('0')
      expect(getMetricValue('Active Capacity')).toBe('0')
    })

    it('sums only future opportunities for a mixed set', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([
        { ...futureOpen, title: 'Future Open Shift' },
        { ...futureClosed, title: 'Future Closed Shift' },
        { ...pastOpen, title: 'Past Open Shift' },
        { ...pastClosed, title: 'Past Closed Shift' },
      ])

      renderPage()

      await waitFor(() => {
        expect(getMetricValue('Active Registrations')).toBe('8')
      })
      expect(getMetricValue('Active Capacity')).toBe('18')
    })
  })

  describe('editing organization information', () => {
    function enterEditMode() {
      fireEvent.click(
        screen.getByRole('button', { name: 'Edit organization information' }),
      )
    }

    it('shows the edit icon with an accessible name', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()

      expect(
        await screen.findByRole('button', { name: 'Edit organization information' }),
      ).toBeInTheDocument()
    })

    it('shows prepopulated fields when the edit icon is clicked', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      expect(screen.getByLabelText('Organization name')).toHaveValue(
        organizationFixture.name,
      )
      expect(screen.getByLabelText('Description')).toHaveValue(
        organizationFixture.description,
      )
      expect(screen.getByLabelText('Email')).toHaveValue(organizationFixture.email)
      expect(screen.getByLabelText('Website')).toHaveValue(organizationFixture.website)
    })

    it('Cancel restores display mode without calling the API', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: 'Changed Name' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: organizationFixture.name })).toBeInTheDocument()
      expect(mockedUpdateCurrentOrganization).not.toHaveBeenCalled()
    })

    it('Save calls updateCurrentOrganization with the access token and edited field values', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      mockedUpdateCurrentOrganization.mockResolvedValue({
        ...organizationFixture,
        name: 'Updated Food Bank',
      })

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: 'Updated Food Bank' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(mockedUpdateCurrentOrganization).toHaveBeenCalledWith('token', {
          name: 'Updated Food Bank',
          description: organizationFixture.description,
          email: organizationFixture.email,
          website: organizationFixture.website,
        })
      })
    })

    it('calls updateOrganizationProfile after a successful save', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      const updateOrganizationProfile = vi.fn()
      mockAuth({ updateOrganizationProfile })
      const updatedOrganization = { ...organizationFixture, name: 'Updated Food Bank' }
      mockedUpdateCurrentOrganization.mockResolvedValue(updatedOrganization)

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: 'Updated Food Bank' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(updateOrganizationProfile).toHaveBeenCalledWith(updatedOrganization)
      })
    })

    it('returns to display mode and shows updated information after a successful save', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      const updatedOrganization = { ...organizationFixture, name: 'Updated Food Bank' }
      mockedUpdateCurrentOrganization.mockResolvedValue(updatedOrganization)
      mockAuth({ organizationProfile: updatedOrganization })

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: 'Updated Food Bank' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument()
      })
      expect(screen.getByRole('heading', { name: 'Updated Food Bank' })).toBeInTheDocument()
    })

    it('shows an error and keeps the form open when the update fails', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      mockedUpdateCurrentOrganization.mockRejectedValue(
        new Error('Unable to update organization profile: 500'),
      )

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Unable to update organization profile: 500',
      )
      expect(screen.getByLabelText('Organization name')).toBeInTheDocument()
    })

    it('disables Save and Cancel while submitting', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      let resolveUpdate: (value: typeof organizationFixture) => void = () => {}
      mockedUpdateCurrentOrganization.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve
        }),
      )

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
      })
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

      resolveUpdate(organizationFixture)

      await waitFor(() => {
        expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument()
      })
    })

    it('shows an understandable error when the access token is missing', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      mockAuth({ accessToken: '' })

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      expect(
        await screen.findByText('Your authentication session is unavailable.'),
      ).toBeInTheDocument()
      expect(mockedUpdateCurrentOrganization).not.toHaveBeenCalled()
    })

    it('prevents the API request when name and email are blank', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: '   ' },
      })
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      expect(await screen.findByText('Organization name is required.')).toBeInTheDocument()
      expect(screen.getByText('Email is required.')).toBeInTheDocument()
      expect(mockedUpdateCurrentOrganization).not.toHaveBeenCalled()
    })
  })
})
