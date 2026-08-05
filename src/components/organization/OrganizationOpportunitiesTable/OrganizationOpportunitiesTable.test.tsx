import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrganizationOpportunitiesTable from './OrganizationOpportunitiesTable'
import { opp1, opp2, opp3, opp7 } from '../../../tests/fixtures/opportunities'

// All fixture dates (2026-06-28 through 2026-07-20) are fixed in the future relative to
// this mocked "today", so they exercise future-opportunity behavior deterministically
// regardless of when the test suite actually runs.
const MOCKED_TODAY = '2026-01-01T00:00:00'

const openOpportunity = opp1
const closedOpportunity = {
  ...opp3,
  opportunityId: 'opp-closed',
  status: 'CLOSED' as const,
  registeredCount: 0,
}
const closedOpportunityWithRegistrations = {
  ...opp3,
  opportunityId: 'opp-closed-with-registrations',
  status: 'CLOSED' as const,
  registeredCount: 5,
}
const pastOpenOpportunity = {
  ...opp1,
  opportunityId: 'opp-past-open',
  date: '2025-06-01',
  status: 'OPEN' as const,
}
const pastClosedOpportunity = {
  ...opp1,
  opportunityId: 'opp-past-closed',
  date: '2025-06-01',
  status: 'CLOSED' as const,
}
const pastClosedOpportunityWithZeroRegistrations = {
  ...opp1,
  opportunityId: 'opp-past-closed-zero-registrations',
  date: '2025-06-01',
  status: 'CLOSED' as const,
  registeredCount: 0,
}

function renderTable(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('OrganizationOpportunitiesTable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a Close button for a future OPEN opportunity', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('shows a Delete button instead of Close for a future CLOSED opportunity with zero registrations', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[closedOpportunity]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('does not offer a Delete button for a CLOSED opportunity that still has registrations', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[closedOpportunityWithRegistrations]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('calls onCloseOpportunity with the correct opportunityId when Close is clicked', () => {
    const handleClose = vi.fn()

    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={handleClose}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(handleClose).toHaveBeenCalledWith(openOpportunity.opportunityId)
  })

  it('calls onDeleteOpportunity with the correct opportunityId when Delete is clicked', () => {
    const handleDelete = vi.fn()

    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[closedOpportunity]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={handleDelete}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(handleDelete).toHaveBeenCalledWith(closedOpportunity.opportunityId)
  })

  it('disables and relabels the button for the row that is closing', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
        closingOpportunityId={openOpportunity.opportunityId}
      />,
    )

    const button = screen.getByRole('button', { name: 'Closing...' })
    expect(button).toBeDisabled()
  })

  it('disables and relabels the button for the row that is deleting', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[closedOpportunity]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
        deletingOpportunityId={closedOpportunity.opportunityId}
      />,
    )

    const button = screen.getByRole('button', { name: 'Deleting...' })
    expect(button).toBeDisabled()
  })

  it('keeps a different OPEN row enabled while another row is closing', () => {
    const otherOpenOpportunity = { ...opp3, opportunityId: 'opp-other' }

    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity, otherOpenOpportunity]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
        closingOpportunityId={openOpportunity.opportunityId}
      />,
    )

    const closingButton = screen.getByRole('button', { name: 'Closing...' })
    const enabledButton = screen.getByRole('button', { name: 'Close' })

    expect(closingButton).toBeDisabled()
    expect(enabledButton).not.toBeDisabled()
  })

  it('links the opportunity title to its organization details page', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    const titleLink = screen.getByRole('link', { name: openOpportunity.title })
    expect(titleLink).toHaveAttribute(
      'href',
      `/organization/opportunities/${openOpportunity.opportunityId}`,
    )
  })

  it('links the edit icon to the edit page with an accessible label', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    const editLink = screen.getByRole('link', { name: `Edit ${openOpportunity.title}` })
    expect(editLink).toHaveAttribute(
      'href',
      `/organization/opportunities/${openOpportunity.opportunityId}/edit`,
    )
  })

  it('shows the formatted time range for an opportunity with structured startTime/endTime', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    expect(screen.getByText('9:00 AM – 12:00 PM')).toBeInTheDocument()
  })

  it('shows the legacy time unchanged for an opportunity with only legacy time', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[opp7]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument()
  })

  it('shows an empty Time cell when neither structured nor legacy time exists', () => {
    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[opp2]}
        onCloseOpportunity={vi.fn()}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    const timeCell = screen.getByText(opp2.title).closest('tr')?.querySelector('[data-label="Time"]')
    expect(timeCell).toHaveTextContent('')
  })

  it('does not navigate when the Close button is clicked', () => {
    const handleClose = vi.fn()

    renderTable(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={handleClose}
        onDeleteOpportunity={vi.fn()}
      />,
    )

    const closeButton = screen.getByRole('button', { name: 'Close' })
    expect(closeButton.closest('a')).toBeNull()

    fireEvent.click(closeButton)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  describe('reopening an opportunity', () => {
    const todayClosedOpportunity = {
      ...opp1,
      opportunityId: 'opp-today-closed',
      date: '2026-01-01',
      status: 'CLOSED' as const,
    }

    it('shows a Reopen button for a future CLOSED opportunity', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[closedOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
          onReopenOpportunity={vi.fn()}
        />,
      )

      expect(screen.getByRole('button', { name: 'Reopen' })).toBeInTheDocument()
    })

    it('shows a Reopen button for a CLOSED opportunity dated today', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[todayClosedOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
          onReopenOpportunity={vi.fn()}
        />,
      )

      expect(screen.getByRole('button', { name: 'Reopen' })).toBeInTheDocument()
    })

    it('does not show a Reopen button for a past CLOSED opportunity', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[pastClosedOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
          onReopenOpportunity={vi.fn()}
        />,
      )

      expect(screen.queryByRole('button', { name: 'Reopen' })).not.toBeInTheDocument()
    })

    it('does not show a Reopen button for an OPEN opportunity', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[openOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
          onReopenOpportunity={vi.fn()}
        />,
      )

      expect(screen.queryByRole('button', { name: 'Reopen' })).not.toBeInTheDocument()
    })

    it('shows both Reopen and Delete for a future CLOSED opportunity with zero registrations', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[closedOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
          onReopenOpportunity={vi.fn()}
        />,
      )

      expect(screen.getByRole('button', { name: 'Reopen' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    it('shows only Reopen, not Delete, for a future CLOSED opportunity that still has registrations', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[closedOpportunityWithRegistrations]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
          onReopenOpportunity={vi.fn()}
        />,
      )

      expect(screen.getByRole('button', { name: 'Reopen' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    })

    it('calls onReopenOpportunity with the correct opportunityId when Reopen is clicked', () => {
      const handleReopen = vi.fn()

      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[closedOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
          onReopenOpportunity={handleReopen}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Reopen' }))

      expect(handleReopen).toHaveBeenCalledWith(closedOpportunity.opportunityId)
    })

    it('disables and relabels the button for the row that is reopening', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[closedOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
          onReopenOpportunity={vi.fn()}
          reopeningOpportunityId={closedOpportunity.opportunityId}
        />,
      )

      const button = screen.getByRole('button', { name: 'Reopening...' })
      expect(button).toBeDisabled()
    })
  })

  describe('past opportunities', () => {
    it('shows Completed as the status regardless of the stored OPEN status', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[pastOpenOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
        />,
      )

      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.queryByText('Open')).not.toBeInTheDocument()
    })

    it('shows Closed as the status for a past opportunity with stored CLOSED status - stored status takes precedence over date', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[pastClosedOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
        />,
      )

      expect(screen.getByText('Closed')).toBeInTheDocument()
      expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    })

    it('shows only a View link for a past OPEN (Completed) opportunity, never Close or Delete', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[pastOpenOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
        />,
      )

      expect(screen.getByRole('link', { name: 'View' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    })

    it('shows the closed action behavior (not View) for a past CLOSED opportunity', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[pastClosedOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
        />,
      )

      expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    })

    it('shows a Delete button for a past CLOSED opportunity with zero registrations', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[pastClosedOpportunityWithZeroRegistrations]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
        />,
      )

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    it('does not show the edit icon link', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[pastOpenOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
        />,
      )

      expect(
        screen.queryByRole('link', { name: `Edit ${pastOpenOpportunity.title}` }),
      ).not.toBeInTheDocument()
    })

    it('the View link points to the opportunity details page', () => {
      renderTable(
        <OrganizationOpportunitiesTable
          opportunities={[pastOpenOpportunity]}
          onCloseOpportunity={vi.fn()}
          onDeleteOpportunity={vi.fn()}
        />,
      )

      expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
        'href',
        `/organization/opportunities/${pastOpenOpportunity.opportunityId}`,
      )
    })
  })
})
