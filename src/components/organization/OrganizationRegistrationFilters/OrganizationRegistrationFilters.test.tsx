import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrganizationRegistrationFilters from './OrganizationRegistrationFilters'
import { EMPTY_REGISTRATION_OPPORTUNITY_FILTERS } from '../../../utils/registrationOpportunityFilters'

describe('OrganizationRegistrationFilters', () => {
  it('renders the search input with the expected label and placeholder', () => {
    render(
      <OrganizationRegistrationFilters
        value={EMPTY_REGISTRATION_OPPORTUNITY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('searchbox', { name: 'Search' }),
    ).toHaveAttribute('placeholder', 'Search opportunities or volunteers...')
  })

  it('renders all status options', () => {
    render(
      <OrganizationRegistrationFilters
        value={EMPTY_REGISTRATION_OPPORTUNITY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const statusSelect = screen.getByRole('combobox', { name: 'Opportunity Status' })
    expect(statusSelect).toHaveTextContent('All Statuses')
    expect(statusSelect).toHaveTextContent('Open')
    expect(statusSelect).toHaveTextContent('Completed')
    expect(statusSelect).toHaveTextContent('Closed')
  })

  it('renders all registration-state options', () => {
    render(
      <OrganizationRegistrationFilters
        value={EMPTY_REGISTRATION_OPPORTUNITY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const registrationsSelect = screen.getByRole('combobox', { name: 'Registrations' })
    expect(registrationsSelect).toHaveTextContent('All Opportunities')
    expect(registrationsSelect).toHaveTextContent('With Registrations')
    expect(registrationsSelect).toHaveTextContent('No Registrations')
  })

  it('calls onChange with the updated search term', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationRegistrationFilters
        value={EMPTY_REGISTRATION_OPPORTUNITY_FILTERS}
        onChange={onChange}
      />,
    )

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'a')

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      search: 'a',
    })
  })

  it('calls onChange with the selected status', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationRegistrationFilters
        value={EMPTY_REGISTRATION_OPPORTUNITY_FILTERS}
        onChange={onChange}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: 'Opportunity Status' }), 'Open')

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS, status: 'OPEN' })
  })

  it('calls onChange with the selected registration state', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationRegistrationFilters
        value={EMPTY_REGISTRATION_OPPORTUNITY_FILTERS}
        onChange={onChange}
      />,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Registrations' }),
      'With Registrations',
    )

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      registrationState: 'WITH_REGISTRATIONS',
    })
  })

  it('does not show a Clear filters button when no filters are active', () => {
    render(
      <OrganizationRegistrationFilters
        value={EMPTY_REGISTRATION_OPPORTUNITY_FILTERS}
        onChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })

  it('shows a Clear filters button when a filter is active, and resets on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationRegistrationFilters
        value={{ ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS, search: 'food' }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onChange).toHaveBeenCalledWith(EMPTY_REGISTRATION_OPPORTUNITY_FILTERS)
  })
})
