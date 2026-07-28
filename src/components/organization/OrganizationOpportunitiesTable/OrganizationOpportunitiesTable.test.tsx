import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import OrganizationOpportunitiesTable from './OrganizationOpportunitiesTable'
import { opp1, opp3 } from '../../../tests/fixtures/opportunities'

const openOpportunity = opp1
const closedOpportunity = { ...opp3, opportunityId: 'opp-closed', status: 'CLOSED' as const }

describe('OrganizationOpportunitiesTable', () => {
  it('shows a Close button for an OPEN opportunity', () => {
    render(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('does not show an active Close button for a CLOSED opportunity', () => {
    render(
      <OrganizationOpportunitiesTable
        opportunities={[closedOpportunity]}
        onCloseOpportunity={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('calls onCloseOpportunity with the correct opportunityId when Close is clicked', () => {
    const handleClose = vi.fn()

    render(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={handleClose}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(handleClose).toHaveBeenCalledWith(openOpportunity.opportunityId)
  })

  it('disables and relabels the button for the row that is closing', () => {
    render(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity]}
        onCloseOpportunity={vi.fn()}
        closingOpportunityId={openOpportunity.opportunityId}
      />,
    )

    const button = screen.getByRole('button', { name: 'Closing...' })
    expect(button).toBeDisabled()
  })

  it('keeps a different OPEN row enabled while another row is closing', () => {
    const otherOpenOpportunity = { ...opp3, opportunityId: 'opp-other' }

    render(
      <OrganizationOpportunitiesTable
        opportunities={[openOpportunity, otherOpenOpportunity]}
        onCloseOpportunity={vi.fn()}
        closingOpportunityId={openOpportunity.opportunityId}
      />,
    )

    const closingButton = screen.getByRole('button', { name: 'Closing...' })
    const enabledButton = screen.getByRole('button', { name: 'Close' })

    expect(closingButton).toBeDisabled()
    expect(enabledButton).not.toBeDisabled()
  })
})
