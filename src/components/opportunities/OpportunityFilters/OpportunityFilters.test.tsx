import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OpportunityFilters from './OpportunityFilters'
import { EMPTY_FILTERS } from '../../../utils/opportunityFilters'
import { opp1, opp2, opp3 } from '../../../tests/fixtures/opportunities'

const allOpportunities = [opp1, opp2, opp3]

describe('OpportunityFilters', () => {
  it('populates the category dropdown with unique values from the opportunities', () => {
    render(
      <OpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const categorySelect = screen.getByRole('combobox', { name: 'Filter by category' })
    expect(categorySelect).toHaveTextContent('All Categories')
    expect(categorySelect).toHaveTextContent('Food')
    expect(categorySelect).toHaveTextContent('Environment')
  })

  it('populates the location dropdown with unique values from the opportunities', () => {
    render(
      <OpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const locationSelect = screen.getByRole('combobox', { name: 'Filter by location' })
    expect(locationSelect).toHaveTextContent('Seattle, WA')
    expect(locationSelect).toHaveTextContent('Bellevue, WA')
  })

  it('populates the organization dropdown with unique values from the opportunities', () => {
    render(
      <OpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const orgSelect = screen.getByRole('combobox', { name: 'Filter by organization' })
    expect(orgSelect).toHaveTextContent('Seattle Food Bank')
    expect(orgSelect).toHaveTextContent('Green City Cleanup')
  })

  it('calls onChange with the updated search term as the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_FILTERS}
        onChange={onChange}
      />,
    )

    await user.type(screen.getByRole('searchbox', { name: 'Search opportunities' }), 'a')

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, search: 'a' })
  })

  it('calls onChange with the selected category', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_FILTERS}
        onChange={onChange}
      />,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter by category' }),
      'Food',
    )

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, category: 'Food' })
  })

  it('does not show a Clear filters button when no filters are active', () => {
    render(
      <OpportunityFilters
        opportunities={allOpportunities}
        value={EMPTY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument()
  })

  it('shows a Clear filters button when a filter is active, and resets on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OpportunityFilters
        opportunities={allOpportunities}
        value={{ ...EMPTY_FILTERS, category: 'Food' }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS)
  })
})