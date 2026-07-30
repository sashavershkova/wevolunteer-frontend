import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrganizationVolunteerFilters from './OrganizationVolunteerFilters'
import { EMPTY_ORGANIZATION_VOLUNTEER_FILTERS } from '../../../utils/organizationVolunteerFilters'

describe('OrganizationVolunteerFilters', () => {
  it('renders the search input with the expected label and placeholder', () => {
    render(
      <OrganizationVolunteerFilters
        value={EMPTY_ORGANIZATION_VOLUNTEER_FILTERS}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveAttribute(
      'placeholder',
      'Search volunteers...',
    )
  })

  it('renders all Volunteer Status options', () => {
    render(
      <OrganizationVolunteerFilters
        value={EMPTY_ORGANIZATION_VOLUNTEER_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const select = screen.getByRole('combobox', { name: 'Volunteer Status' })
    expect(select).toHaveTextContent('All Volunteers')
    expect(select).toHaveTextContent('New Volunteer')
    expect(select).toHaveTextContent('Returning Volunteer')
    expect(select).toHaveTextContent('Frequent Volunteer')
  })

  it('renders all Activity options', () => {
    render(
      <OrganizationVolunteerFilters
        value={EMPTY_ORGANIZATION_VOLUNTEER_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const select = screen.getByRole('combobox', { name: 'Activity' })
    expect(select).toHaveTextContent('All Activity')
    expect(select).toHaveTextContent('Has Upcoming Registration')
    expect(select).toHaveTextContent('Registration History Only')
  })

  it('renders all Sort options with Most Registrations as default', () => {
    render(
      <OrganizationVolunteerFilters
        value={EMPTY_ORGANIZATION_VOLUNTEER_FILTERS}
        onChange={vi.fn()}
      />,
    )

    const select = screen.getByRole('combobox', { name: 'Sort' }) as HTMLSelectElement
    expect(select).toHaveTextContent('Most Registrations')
    expect(select).toHaveTextContent('Most Recently Registered')
    expect(select).toHaveTextContent('Name A–Z')
    expect(select.value).toBe('MOST_REGISTRATIONS')
  })

  it('calls onChange with the updated search term', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationVolunteerFilters value={EMPTY_ORGANIZATION_VOLUNTEER_FILTERS} onChange={onChange} />,
    )

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'a')

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS, search: 'a' })
  })

  it('calls onChange with the selected status', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationVolunteerFilters value={EMPTY_ORGANIZATION_VOLUNTEER_FILTERS} onChange={onChange} />,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Volunteer Status' }),
      'Frequent Volunteer',
    )

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS, status: 'FREQUENT' })
  })

  it('calls onChange with the selected activity', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationVolunteerFilters value={EMPTY_ORGANIZATION_VOLUNTEER_FILTERS} onChange={onChange} />,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Activity' }),
      'Has Upcoming Registration',
    )

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      activity: 'HAS_UPCOMING',
    })
  })

  it('calls onChange with the selected sort', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationVolunteerFilters value={EMPTY_ORGANIZATION_VOLUNTEER_FILTERS} onChange={onChange} />,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), 'Name A–Z')

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS, sort: 'NAME_ASC' })
  })

  it('does not show a Clear filters button when search/status/activity are at defaults', () => {
    render(
      <OrganizationVolunteerFilters
        value={{ ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS, sort: 'NAME_ASC' }}
        onChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })

  it('shows a Clear filters button when a filter is active, and resets on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <OrganizationVolunteerFilters
        value={{ ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS, search: 'mariya' }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onChange).toHaveBeenCalledWith(EMPTY_ORGANIZATION_VOLUNTEER_FILTERS)
  })
})
