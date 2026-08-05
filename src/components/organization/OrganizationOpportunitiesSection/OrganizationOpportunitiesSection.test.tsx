import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrganizationOpportunitiesSection from './OrganizationOpportunitiesSection'
import { useAppAuth } from '../../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../../services/api/organizationService'
import {
  closeOpportunity,
  deleteOpportunity,
  reopenOpportunity,
} from '../../../services/api/opportunityService'
import { opp1 } from '../../../tests/fixtures/opportunities'
import type { Opportunity } from '../../../types/Opportunity'
import {
  CLOSE_OPPORTUNITY_CONFIRMATION_MESSAGE,
  REOPEN_OPPORTUNITY_CONFIRMATION_MESSAGE,
} from '../../../constants/opportunityMessages'

const MOCKED_TODAY = '2026-01-01T00:00:00'

vi.mock('../../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../../services/api/organizationService', () => ({
  getMyOrganizationOpportunities: vi.fn(),
}))

vi.mock('../../../services/api/opportunityService', () => ({
  closeOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
  reopenOpportunity: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyOrganizationOpportunities = vi.mocked(getMyOrganizationOpportunities)
const mockedCloseOpportunity = vi.mocked(closeOpportunity)
const mockedDeleteOpportunity = vi.mocked(deleteOpportunity)
const mockedReopenOpportunity = vi.mocked(reopenOpportunity)

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

function renderSection() {
  return render(
    <MemoryRouter initialEntries={['/organization/opportunities']}>
      <Routes>
        <Route
          path="/organization/opportunities"
          element={<OrganizationOpportunitiesSection headingLevel="h1" />}
        />
        <Route
          path="/organization/opportunities/new"
          element={<div>Create Opportunity Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OrganizationOpportunitiesSection', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetMyOrganizationOpportunities.mockReset()
    mockedCloseOpportunity.mockReset()
    mockedDeleteOpportunity.mockReset()
    mockedReopenOpportunity.mockReset()
    mockAuth()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads organization opportunities using the existing service', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderSection()

    expect(await screen.findByText(opp1.title)).toBeInTheDocument()
    expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledWith('token')
  })

  it('opens a confirmation prompt with the shared message when Close is clicked, without calling the API before confirmation', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderSection()

    const closeButton = await screen.findByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    expect(confirmSpy).toHaveBeenCalledWith(CLOSE_OPPORTUNITY_CONFIRMATION_MESSAGE)
    expect(mockedCloseOpportunity).not.toHaveBeenCalled()
  })

  it('does not call closeOpportunity and leaves the row Open when the confirmation is cancelled', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderSection()

    const closeButton = await screen.findByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    expect(mockedCloseOpportunity).not.toHaveBeenCalled()
    expect(within(screen.getByRole('table')).getByText('Open')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('closes an opportunity and updates state locally without refetching', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const closedOpportunity: Opportunity = { ...opp1, status: 'CLOSED' }
    mockedCloseOpportunity.mockResolvedValue(closedOpportunity)

    renderSection()

    expect(await screen.findByText(opp1.title)).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(mockedCloseOpportunity).toHaveBeenCalledWith('token', opp1.opportunityId)
    })

    const table = await screen.findByRole('table')
    expect(await within(table).findByText('Closed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledTimes(1)
  })

  it('replaces the opportunity with the backend response after closing, showing registeredCount reset to 0', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const closedOpportunity: Opportunity = {
      ...opp1,
      status: 'CLOSED',
      registeredCount: 0,
      availableSpots: opp1.capacity,
    }
    mockedCloseOpportunity.mockResolvedValue(closedOpportunity)

    renderSection()

    expect(await screen.findByText(opp1.title)).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(mockedCloseOpportunity).toHaveBeenCalledWith('token', opp1.opportunityId)
    })

    const table = await screen.findByRole('table')
    expect(await within(table).findByText('Closed')).toBeInTheDocument()
    expect(screen.getByText(`0 / ${opp1.capacity}`)).toBeInTheDocument()
    // A zeroed registeredCount means the Delete guard now allows deletion.
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('shows a pending state on the closing row while the request is in flight and prevents a duplicate submission', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    let resolveClose: (value: Opportunity) => void = () => {}
    mockedCloseOpportunity.mockReturnValue(
      new Promise((resolve) => {
        resolveClose = resolve
      }),
    )

    renderSection()

    const closeButton = await screen.findByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    const pendingButton = await screen.findByRole('button', { name: 'Closing...' })
    expect(pendingButton).toBeDisabled()

    fireEvent.click(pendingButton)
    expect(mockedCloseOpportunity).toHaveBeenCalledTimes(1)

    resolveClose({ ...opp1, status: 'CLOSED' })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Closing...' })).not.toBeInTheDocument()
    })
  })

  it('shows an action-specific error and keeps the opportunity OPEN when closing fails', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockedCloseOpportunity.mockRejectedValue(
      new Error('Unable to close this opportunity: 403'),
    )

    renderSection()

    const closeButton = await screen.findByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to close this opportunity: 403',
    )
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Open')).toBeInTheDocument()
  })

  describe('reopening an opportunity', () => {
    const futureClosedOpportunity: Opportunity = {
      ...opp1,
      status: 'CLOSED',
      date: '2026-06-01',
    }
    const todayClosedOpportunity: Opportunity = {
      ...opp1,
      status: 'CLOSED',
      date: '2026-01-01',
    }
    const pastClosedOpportunity: Opportunity = {
      ...opp1,
      status: 'CLOSED',
      date: '2025-06-01',
    }

    it('shows a Reopen button for a future CLOSED opportunity', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureClosedOpportunity])

      renderSection()

      expect(await screen.findByRole('button', { name: 'Reopen' })).toBeInTheDocument()
    })

    it('shows a Reopen button for a CLOSED opportunity dated today', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([todayClosedOpportunity])

      renderSection()

      expect(await screen.findByRole('button', { name: 'Reopen' })).toBeInTheDocument()
    })

    it('does not show a Reopen button for a past CLOSED opportunity', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([pastClosedOpportunity])

      renderSection()

      await screen.findByText(opp1.title)
      expect(screen.queryByRole('button', { name: 'Reopen' })).not.toBeInTheDocument()
    })

    it('does not show a Reopen button for an OPEN opportunity', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

      renderSection()

      await screen.findByText(opp1.title)
      expect(screen.queryByRole('button', { name: 'Reopen' })).not.toBeInTheDocument()
    })

    it('opens a confirmation prompt with the shared message and does not call the API before confirmation', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureClosedOpportunity])
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      renderSection()

      const reopenButton = await screen.findByRole('button', { name: 'Reopen' })
      fireEvent.click(reopenButton)

      expect(confirmSpy).toHaveBeenCalledWith(REOPEN_OPPORTUNITY_CONFIRMATION_MESSAGE)
      expect(mockedReopenOpportunity).not.toHaveBeenCalled()
    })

    it('calls reopenOpportunity with the correct token and opportunityId when confirmed', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureClosedOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedReopenOpportunity.mockResolvedValue({ ...futureClosedOpportunity, status: 'OPEN' })

      renderSection()

      const reopenButton = await screen.findByRole('button', { name: 'Reopen' })
      fireEvent.click(reopenButton)

      await waitFor(() => {
        expect(mockedReopenOpportunity).toHaveBeenCalledWith('token', opp1.opportunityId)
      })
    })

    it('shows a pending state on the reopening row while the request is in flight and prevents a duplicate submission', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureClosedOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      let resolveReopen: (value: Opportunity) => void = () => {}
      mockedReopenOpportunity.mockReturnValue(
        new Promise((resolve) => {
          resolveReopen = resolve
        }),
      )

      renderSection()

      const reopenButton = await screen.findByRole('button', { name: 'Reopen' })
      fireEvent.click(reopenButton)

      const pendingButton = await screen.findByRole('button', { name: 'Reopening...' })
      expect(pendingButton).toBeDisabled()

      fireEvent.click(pendingButton)
      expect(mockedReopenOpportunity).toHaveBeenCalledTimes(1)

      resolveReopen({ ...futureClosedOpportunity, status: 'OPEN' })

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Reopening...' })).not.toBeInTheDocument()
      })
    })

    it('updates the row to Open, restores Close, and resets registeredCount after a successful reopen', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureClosedOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const reopenedOpportunity: Opportunity = {
        ...futureClosedOpportunity,
        status: 'OPEN',
        registeredCount: 0,
        availableSpots: futureClosedOpportunity.capacity,
      }
      mockedReopenOpportunity.mockResolvedValue(reopenedOpportunity)

      renderSection()

      const reopenButton = await screen.findByRole('button', { name: 'Reopen' })
      fireEvent.click(reopenButton)

      const table = await screen.findByRole('table')
      expect(await within(table).findByText('Open')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reopen' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
      expect(screen.getByText(`0 / ${futureClosedOpportunity.capacity}`)).toBeInTheDocument()
      expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledTimes(1)
    })

    it('shows an action-specific error and keeps the opportunity Closed when reopening fails', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([futureClosedOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedReopenOpportunity.mockRejectedValue(
        new Error('Unable to reopen this opportunity: 409'),
      )

      renderSection()

      const reopenButton = await screen.findByRole('button', { name: 'Reopen' })
      fireEvent.click(reopenButton)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Unable to reopen this opportunity: 409',
      )
      expect(within(screen.getByRole('table')).getByText('Closed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reopen' })).toBeInTheDocument()
    })
  })

  describe('deleting an opportunity', () => {
    const closedFutureOpportunity: Opportunity = {
      ...opp1,
      status: 'CLOSED',
      registeredCount: 0,
      availableSpots: opp1.capacity,
    }

    it('does not offer deletion for a closed opportunity that still has registrations', async () => {
      const closedWithRegistrations: Opportunity = { ...opp1, status: 'CLOSED' }
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedWithRegistrations])

      renderSection()

      expect(await screen.findByText(opp1.title)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    })

    it('confirms before calling the delete API', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteOpportunity.mockResolvedValue(undefined)

      renderSection()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this opportunity? This cannot be undone.',
      )
      await waitFor(() => {
        expect(mockedDeleteOpportunity).toHaveBeenCalledWith('token', opp1.opportunityId)
      })
    })

    it('does not call the API when the confirmation is dismissed', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(false)

      renderSection()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      expect(mockedDeleteOpportunity).not.toHaveBeenCalled()
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
    })

    it('removes the row from the table after a successful delete', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteOpportunity.mockResolvedValue(undefined)

      renderSection()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByText(opp1.title)).not.toBeInTheDocument()
      })
    })

    it('shows a pending state on the deleting row while the request is in flight', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      let resolveDelete: () => void = () => {}
      mockedDeleteOpportunity.mockReturnValue(
        new Promise((resolve) => {
          resolveDelete = resolve
        }),
      )

      renderSection()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      const pendingButton = await screen.findByRole('button', { name: 'Deleting...' })
      expect(pendingButton).toBeDisabled()

      resolveDelete()

      await waitFor(() => {
        expect(screen.queryByText(opp1.title)).not.toBeInTheDocument()
      })
    })

    it('shows an action-specific error and keeps the row when deleting fails', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteOpportunity.mockRejectedValue(
        new Error('Unable to delete this opportunity: 409'),
      )

      renderSection()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Unable to delete this opportunity: 409',
      )
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
    })
  })

  it('enables the Create New Opportunity button', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderSection()

    const createButton = await screen.findByRole('button', {
      name: '+ Create New Opportunity',
    })
    expect(createButton).toBeEnabled()
  })

  it('navigates to the create opportunity page when clicked', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderSection()

    const createButton = await screen.findByRole('button', {
      name: '+ Create New Opportunity',
    })
    fireEvent.click(createButton)

    expect(await screen.findByText('Create Opportunity Page')).toBeInTheDocument()
  })

  it('renders the section heading as an h1 when headingLevel is h1', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderSection()

    expect(await screen.findByRole('heading', { level: 1, name: 'My Opportunities' })).toBeInTheDocument()
  })

  describe('sorting and filtering', () => {
    const closedEarly: Opportunity = {
      ...opp1,
      opportunityId: 'closed-early',
      title: 'Closed Early Shift',
      date: '2026-01-05',
      status: 'CLOSED',
    }
    const openLate: Opportunity = {
      ...opp1,
      opportunityId: 'open-late',
      title: 'Open Late Shift',
      date: '2026-12-01',
      status: 'OPEN',
      category: 'Environment',
    }
    const openEarly: Opportunity = {
      ...opp1,
      opportunityId: 'open-early',
      title: 'Open Early Shift',
      date: '2026-02-01',
      status: 'OPEN',
    }

    it('renders non-CLOSED opportunities before CLOSED ones, sorted by date, with CLOSED at the bottom regardless of date', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedEarly, openLate, openEarly])

      renderSection()

      await screen.findByText(openEarly.title)

      const rows = screen.getAllByRole('row').slice(1)
      const titlesInOrder = rows.map((row) => row.textContent)

      expect(titlesInOrder[0]).toContain(openEarly.title)
      expect(titlesInOrder[1]).toContain(openLate.title)
      expect(titlesInOrder[2]).toContain(closedEarly.title)
    })

    it('filters by status', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedEarly, openLate, openEarly])

      renderSection()
      await screen.findByText(openEarly.title)

      const user = userEvent.setup({ delay: null })
      await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'Closed')

      expect(screen.getByText(closedEarly.title)).toBeInTheDocument()
      expect(screen.queryByText(openLate.title)).not.toBeInTheDocument()
      expect(screen.queryByText(openEarly.title)).not.toBeInTheDocument()
    })

    it('clearing filters restores all opportunities', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedEarly, openLate, openEarly])

      renderSection()
      await screen.findByText(openEarly.title)

      const user = userEvent.setup({ delay: null })
      await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'Closed')
      expect(screen.queryByText(openEarly.title)).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(screen.getByText(openEarly.title)).toBeInTheDocument()
      expect(screen.getByText(openLate.title)).toBeInTheDocument()
      expect(screen.getByText(closedEarly.title)).toBeInTheDocument()
    })

    it('combines status and category filters with the required sort order', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedEarly, openLate, openEarly])

      renderSection()
      await screen.findByText(openEarly.title)

      const user = userEvent.setup({ delay: null })
      await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'Open')
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Filter by category' }),
        'Environment',
      )

      expect(screen.getByText(openLate.title)).toBeInTheDocument()
      expect(screen.queryByText(openEarly.title)).not.toBeInTheDocument()
      expect(screen.queryByText(closedEarly.title)).not.toBeInTheDocument()
    })

    it('shows a "no opportunities yet" message when the organization has none', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderSection()

      expect(
        await screen.findByText('You have not created any opportunities yet.'),
      ).toBeInTheDocument()
    })

    it('shows a "no matches" message when filters exclude every opportunity', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([openEarly])

      renderSection()
      await screen.findByText(openEarly.title)

      const user = userEvent.setup({ delay: null })
      await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'Closed')

      expect(
        await screen.findByText('No opportunities match the selected filters.'),
      ).toBeInTheDocument()
    })
  })
})
