import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrganizationOpportunityFilters from './OrganizationOpportunityFilters'
import { EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS } from '../../../utils/organizationOpportunityFilters'
import { opp1, opp2, opp3 } from '../../../tests/fixtures/opportunities'

const allOpportunities = [opp1, opp2, opp3]

describe('OrganizationOpportunityFilters', () => {
  it('renders all status options', () => {
    render(
      <OrganizationOpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const statusSelect = screen.getByRole('combobox', { name: 'Filter by status' })
    expect(statusSelect).toHaveTextContent('All')
    expect(statusSelect).toHaveTextContent('Open')
    expect(statusSelect).toHaveTextContent('Completed')
    expect(statusSelect).toHaveTextContent('Closed')
  })

  it('populates the category dropdown with unique values from the opportunities', () => {
    render(
      <OrganizationOpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const categorySelect = screen.getByRole('combobox', { name: 'Filter by category' })
    expect(categorySelect).toHaveTextContent('Food')
    expect(categorySelect).toHaveTextContent('Environment')
  })

  it('calls onChange with the selected status', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationOpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS}
        onChange={onChange}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'Closed')

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      status: 'CLOSED',
    })
  })

  it('does not show a Clear filters button when no filters are active', () => {
    render(
      <OrganizationOpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })

  it('shows a Clear filters button when a filter is active, and resets on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationOpportunityFilters
        opportunities={allOpportunities}
        value={{ ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS, status: 'OPEN' }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onChange).toHaveBeenCalledWith(EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS)
  })
})
