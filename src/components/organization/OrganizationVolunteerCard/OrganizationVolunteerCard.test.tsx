import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationVolunteerCard from './OrganizationVolunteerCard'
import type { OrganizationVolunteer } from '../../../utils/aggregateOrganizationVolunteers'

function makeVolunteer(overrides: Partial<OrganizationVolunteer> = {}): OrganizationVolunteer {
  return {
    userId: 'user-1',
    name: 'Mariya Mokrynska',
    email: 'mariya@example.com',
    registrationCount: 3,
    opportunityIds: ['opp1', 'opp2', 'opp3'],
    firstRegisteredAt: '2026-07-10T10:00:00',
    mostRecentRegisteredAt: '2026-07-30T10:00:00',
    upcomingRegistrationCount: 1,
    status: 'FREQUENT',
    ...overrides,
  }
}

describe('OrganizationVolunteerCard', () => {
  it('shows a circular initial avatar derived from the name', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ name: 'Mariya' })} />)

    const avatar = screen.getByText('M')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows a V avatar for the "Volunteer" fallback name', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ name: 'Volunteer' })} />)

    expect(screen.getByText('V')).toBeInTheDocument()
  })

  it('shows the volunteer name prominently', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ name: 'Mariya Mokrynska' })} />)

    expect(screen.getByText('Mariya Mokrynska')).toBeInTheDocument()
  })

  it('renders the email as a mailto link', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ email: 'mariya@example.com' })} />)

    expect(screen.getByRole('link', { name: 'mariya@example.com' })).toHaveAttribute(
      'href',
      'mailto:mariya@example.com',
    )
  })

  it('does not render an email link when email is null', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ email: null })} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows "New Volunteer" for NEW status', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ status: 'NEW' })} />)
    expect(screen.getByText('New Volunteer')).toBeInTheDocument()
  })

  it('shows "Returning Volunteer" for RETURNING status', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ status: 'RETURNING' })} />)
    expect(screen.getByText('Returning Volunteer')).toBeInTheDocument()
  })

  it('shows "Frequent Volunteer" for FREQUENT status', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ status: 'FREQUENT' })} />)
    expect(screen.getByText('Frequent Volunteer')).toBeInTheDocument()
  })

  it('uses honest registration wording, singular for one registration', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ registrationCount: 1 })} />)

    expect(screen.getByText('1 registration')).toBeInTheDocument()
    expect(screen.queryByText(/volunteered/i)).not.toBeInTheDocument()
  })

  it('uses plural wording for multiple registrations', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ registrationCount: 3 })} />)

    expect(screen.getByText('3 registrations')).toBeInTheDocument()
  })

  it('shows the upcoming registration count when greater than zero', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ upcomingRegistrationCount: 1 })} />)

    expect(screen.getByText('1 upcoming')).toBeInTheDocument()
  })

  it('always shows the upcoming line, even at zero, for consistent card structure', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ upcomingRegistrationCount: 0 })} />)

    expect(screen.getByText('0 upcoming')).toBeInTheDocument()
  })

  it('shows formatted first-registered and most-recent dates', () => {
    render(
      <OrganizationVolunteerCard
        volunteer={makeVolunteer({
          firstRegisteredAt: '2026-07-10T10:00:00',
          mostRecentRegisteredAt: '2026-07-30T10:00:00',
        })}
      />,
    )

    expect(screen.getByText('First registered Jul 10, 2026')).toBeInTheDocument()
    expect(screen.getByText('Most recent Jul 30, 2026')).toBeInTheDocument()
  })

  it('shows a safe placeholder instead of crashing when registeredAt values are null', () => {
    render(
      <OrganizationVolunteerCard
        volunteer={makeVolunteer({ firstRegisteredAt: null, mostRecentRegisteredAt: null })}
      />,
    )

    expect(screen.getByText('First registered —')).toBeInTheDocument()
    expect(screen.getByText('Most recent —')).toBeInTheDocument()
  })

  it('does not display the raw userId anywhere', () => {
    render(<OrganizationVolunteerCard volunteer={makeVolunteer({ userId: 'user-abc-123' })} />)

    expect(screen.queryByText('user-abc-123')).not.toBeInTheDocument()
  })
})
