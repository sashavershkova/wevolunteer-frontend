import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VolunteerRegistrationFilters from './VolunteerRegistrationFilters'
import { EMPTY_VOLUNTEER_REGISTRATION_FILTERS } from '../../../utils/volunteerRegistrationFilters'
import type { Registration } from '../../../services/api/registrationService'

function makeRegistration(overrides: Partial<Registration>): Registration {
    return {
        userId: 'user1',
        opportunityId: 'opp1',
        title: 'Food Bank Volunteer Shift',
        date: '2026-08-10',
        location: 'Seattle, WA',
        organizationId: 'org1',
        organizationName: 'Seattle Food Bank',
        registrationStatus: 'ACTIVE',
        volunteerName: 'Sasha',
        email: 'sasha@example.com',
        registeredAt: '2026-07-01T00:00:00Z',
        ...overrides,
    }
    }

    const allRegistrations = [
    makeRegistration({ opportunityId: 'opp1' }),
    makeRegistration({
        opportunityId: 'opp3',
        location: 'Bellevue, WA',
        organizationId: 'org2',
        organizationName: 'Green City Cleanup',
    }),
    ]

    describe('VolunteerRegistrationFilters', () => {
    it('populates the location dropdown with unique values from the registrations', () => {
        render(
        <VolunteerRegistrationFilters
            registrations={allRegistrations}
            value={EMPTY_VOLUNTEER_REGISTRATION_FILTERS}
            onChange={vi.fn()}
        />,
        )

        const locationSelect = screen.getByRole('combobox', { name: 'Filter by location' })
        expect(locationSelect).toHaveTextContent('Seattle, WA')
        expect(locationSelect).toHaveTextContent('Bellevue, WA')
    })

    it('populates the organization dropdown with unique values from the registrations', () => {
        render(
        <VolunteerRegistrationFilters
            registrations={allRegistrations}
            value={EMPTY_VOLUNTEER_REGISTRATION_FILTERS}
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
        <VolunteerRegistrationFilters
            registrations={allRegistrations}
            value={EMPTY_VOLUNTEER_REGISTRATION_FILTERS}
            onChange={onChange}
        />,
        )

        await user.type(
        screen.getByRole('searchbox', { name: 'Search registrations' }),
        'a',
        )

        expect(onChange).toHaveBeenCalledWith({ ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS, search: 'a' })
    })

    it('calls onChange with the selected location', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
        <VolunteerRegistrationFilters
            registrations={allRegistrations}
            value={EMPTY_VOLUNTEER_REGISTRATION_FILTERS}
            onChange={onChange}
        />,
        )

        await user.selectOptions(
        screen.getByRole('combobox', { name: 'Filter by location' }),
        'Bellevue, WA',
        )

        expect(onChange).toHaveBeenCalledWith({
        ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
        location: 'Bellevue, WA',
        })
    })

    it('renders the date range filter button', () => {
        render(
        <VolunteerRegistrationFilters
            registrations={allRegistrations}
            value={EMPTY_VOLUNTEER_REGISTRATION_FILTERS}
            onChange={vi.fn()}
        />,
        )

        expect(screen.getByRole('button', { name: /Any Date/ })).toBeInTheDocument()
    })

    it('does not show a Clear filters button when no filters are active', () => {
        render(
        <VolunteerRegistrationFilters
            registrations={allRegistrations}
            value={EMPTY_VOLUNTEER_REGISTRATION_FILTERS}
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
        <VolunteerRegistrationFilters
            registrations={allRegistrations}
            value={{ ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS, location: 'Seattle, WA' }}
            onChange={onChange}
        />,
        )

        await user.click(screen.getByRole('button', { name: 'Clear filters' }))

        expect(onChange).toHaveBeenCalledWith(EMPTY_VOLUNTEER_REGISTRATION_FILTERS)
    })
})