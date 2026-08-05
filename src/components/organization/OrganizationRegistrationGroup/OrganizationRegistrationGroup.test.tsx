import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrganizationRegistrationGroup from './OrganizationRegistrationGroup'
import { opp1, opp7 } from '../../../tests/fixtures/opportunities'
import type { Registration } from '../../../services/api/registrationService'
import type { Waitlist } from '../../../services/api/waitlistService'

const MOCKED_TODAY = '2026-01-01T00:00:00'

function makeRegistration(overrides: Partial<Registration>): Registration {
  return {
    userId: 'user-1',
    opportunityId: opp1.opportunityId,
    title: opp1.title,
    date: opp1.date,
    location: opp1.location,
    organizationId: opp1.organizationId,
    organizationName: opp1.organizationName,
    registrationStatus: 'ACTIVE',
    volunteerName: 'John Smith',
    email: 'john@example.com',
    registeredAt: '2026-06-01T10:00:00',
    ...overrides,
  }
}

function makeWaitlistEntry(overrides: Partial<Waitlist>): Waitlist {
  return {
    userId: 'user-1',
    opportunityId: opp1.opportunityId,
    title: opp1.title,
    date: opp1.date,
    location: opp1.location,
    organizationId: opp1.organizationId,
    organizationName: opp1.organizationName,
    volunteerName: 'Jordan Miles',
    email: 'jordan@example.com',
    joinedAt: '2026-06-01T10:00:00',
    ...overrides,
  }
}

function renderGroup(
  props: Partial<ComponentProps<typeof OrganizationRegistrationGroup>> = {},
) {
  return render(
    <MemoryRouter>
      <OrganizationRegistrationGroup opportunity={opp1} registrations={[]} {...props} />
    </MemoryRouter>,
  )
}

describe('OrganizationRegistrationGroup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the opportunity title, status, formatted date/time, and registration count', () => {
    renderGroup()

    expect(screen.getByText(opp1.title)).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText(/Jul 10, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/9:00 AM – 12:00 PM/)).toBeInTheDocument()
    expect(screen.getByText(`${opp1.registeredCount} / ${opp1.capacity} registered`)).toBeInTheDocument()
  })

  it('shows Completed for a past opportunity', () => {
    const pastOpportunity = { ...opp1, date: '2025-01-01' }
    renderGroup({ opportunity: pastOpportunity })

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows Closed for a closed opportunity', () => {
    renderGroup({ opportunity: opp7 })

    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('renders volunteer name and email from registration data', () => {
    renderGroup({
      registrations: [
        makeRegistration({ volunteerName: 'Mary Jones', email: 'mary@example.com' }),
      ],
    })

    expect(screen.getByText('Mary Jones')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'mary@example.com' })).toBeInTheDocument()
  })

  it('renders the email as a mailto link', () => {
    renderGroup({
      registrations: [makeRegistration({ email: 'john@example.com' })],
    })

    expect(screen.getByRole('link', { name: 'john@example.com' })).toHaveAttribute(
      'href',
      'mailto:john@example.com',
    )
  })

  it('falls back to "Volunteer" when volunteerName is missing', () => {
    renderGroup({
      registrations: [makeRegistration({ volunteerName: null })],
    })

    expect(screen.getByText('Volunteer')).toBeInTheDocument()
  })

  it('shows a circular initial avatar derived from the volunteer name', () => {
    renderGroup({
      registrations: [makeRegistration({ volunteerName: 'Mariya' })],
    })

    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('derives the avatar initial from the first letter of a full name', () => {
    renderGroup({
      registrations: [makeRegistration({ volunteerName: 'Renata Murzina' })],
    })

    expect(screen.getByText('R')).toBeInTheDocument()
  })

  it('shows a V avatar when the volunteer name is missing', () => {
    renderGroup({
      registrations: [makeRegistration({ volunteerName: null })],
    })

    expect(screen.getByText('V')).toBeInTheDocument()
  })

  it('marks the avatar as decorative', () => {
    renderGroup({
      registrations: [makeRegistration({ volunteerName: 'Mariya' })],
    })

    expect(screen.getByText('M')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows "Active" for an ACTIVE registration status', () => {
    renderGroup({
      registrations: [makeRegistration({ registrationStatus: 'ACTIVE' })],
    })

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows a safely formatted label for a non-ACTIVE registration status', () => {
    renderGroup({
      registrations: [makeRegistration({ registrationStatus: 'NO_SHOW' })],
    })

    expect(screen.getByText('No show')).toBeInTheDocument()
    expect(screen.queryByText('NO_SHOW')).not.toBeInTheDocument()
  })

  it('does not render an email link when email is missing', () => {
    renderGroup({
      registrations: [makeRegistration({ email: null })],
    })

    expect(screen.queryByRole('link', { name: /@/ })).not.toBeInTheDocument()
  })

  it('sorts volunteers by registeredAt ascending', () => {
    renderGroup({
      registrations: [
        makeRegistration({ userId: 'later', volunteerName: 'Later Volunteer', registeredAt: '2026-06-05T10:00:00' }),
        makeRegistration({ userId: 'earlier', volunteerName: 'Earlier Volunteer', registeredAt: '2026-06-01T10:00:00' }),
      ],
    })

    const names = screen.getAllByText(/Volunteer$/).map((node) => node.textContent)
    expect(names).toEqual(['Earlier Volunteer', 'Later Volunteer'])
  })

  it('shows "No volunteers have registered yet." for a zero-registration opportunity', () => {
    renderGroup({ registrations: [] })

    expect(screen.getByText('No volunteers have registered yet.')).toBeInTheDocument()
  })

  it('shows "No one is on the waiting list." when the waitlist is empty', () => {
    renderGroup({ waitlist: [] })

    expect(screen.getByText('Waiting List')).toBeInTheDocument()
    expect(screen.getByText('No one is on the waiting list.')).toBeInTheDocument()
  })

  it('shows the waiting list count, name, and email for each entry', () => {
    renderGroup({
      waitlist: [
        makeWaitlistEntry({ volunteerName: 'Jordan Miles', email: 'jordan@example.com' }),
      ],
    })

    expect(screen.getByText('Waiting List (1)')).toBeInTheDocument()
    expect(screen.getByText('Jordan Miles')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'jordan@example.com' })).toHaveAttribute(
      'href',
      'mailto:jordan@example.com',
    )
  })

  it('numbers waitlist entries by their position, oldest first', () => {
    renderGroup({
      waitlist: [
        makeWaitlistEntry({ userId: 'first', volunteerName: 'Jordan Miles' }),
        makeWaitlistEntry({ userId: 'second', volunteerName: 'Amara Kim' }),
      ],
    })

    const entries = screen.getAllByRole('listitem')
    expect(entries[0]).toHaveTextContent('1')
    expect(entries[0]).toHaveTextContent('Jordan Miles')
    expect(entries[1]).toHaveTextContent('2')
    expect(entries[1]).toHaveTextContent('Amara Kim')
  })

  it('shows the formatted joined date for a waitlist entry', () => {
    renderGroup({
      waitlist: [makeWaitlistEntry({ joinedAt: '2026-05-20T10:00:00' })],
    })

    expect(screen.getByText('Joined May 20, 2026')).toBeInTheDocument()
  })

  it('falls back to "Volunteer" when a waitlist entry has an empty volunteerName', () => {
    renderGroup({
      waitlist: [makeWaitlistEntry({ volunteerName: '' })],
    })

    expect(screen.getAllByText('Volunteer').length).toBeGreaterThan(0)
  })

  it('shows a loading message instead of the waitlist while it is loading', () => {
    renderGroup({ isWaitlistLoading: true, waitlist: [] })

    expect(screen.getByText('Loading waiting list...')).toBeInTheDocument()
    expect(screen.queryByText('No one is on the waiting list.')).not.toBeInTheDocument()
  })

  it('shows a waitlist-specific error message without hiding the registered volunteer list', () => {
    renderGroup({ waitlistError: 'Unable to load the waiting list: 500' })

    expect(screen.getByText('Unable to load the waiting list: 500')).toBeInTheDocument()
    expect(screen.getByText('No volunteers have registered yet.')).toBeInTheDocument()
  })

  it('renders a disabled Send reminder button with an explanatory note', () => {
    renderGroup()

    const button = screen.getByRole('button', { name: 'Send reminder' })
    expect(button).toBeDisabled()
    expect(screen.getByText('Reminder emails are coming soon.')).toBeInTheDocument()
  })

  it('renders a disabled Export CSV button with an explanatory note', () => {
    renderGroup()

    const button = screen.getByRole('button', { name: 'Export CSV' })
    expect(button).toBeDisabled()
    expect(screen.getByText('CSV export is coming soon.')).toBeInTheDocument()
  })

  it('links View Opportunity to the organization opportunity details route', () => {
    renderGroup()

    expect(screen.getByRole('link', { name: 'View Opportunity' })).toHaveAttribute(
      'href',
      `/organization/opportunities/${opp1.opportunityId}`,
    )
  })

  it('shows a loading message instead of the volunteer list while loading', () => {
    renderGroup({ isLoading: true, registrations: [] })

    expect(screen.getByRole('status')).toHaveTextContent('Loading registered volunteers...')
    expect(screen.queryByText('No volunteers have registered yet.')).not.toBeInTheDocument()
  })

  it('shows a card-level error message when this opportunity failed to load, without hiding the card', () => {
    renderGroup({ error: 'Unable to load registered volunteers: 500' })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load registered volunteers: 500',
    )
    expect(screen.getByText(opp1.title)).toBeInTheDocument()
  })

  it('does not crash when capacity is zero', () => {
    const zeroCapacityOpportunity = { ...opp1, capacity: 0, registeredCount: 0 }

    expect(() => renderGroup({ opportunity: zeroCapacityOpportunity })).not.toThrow()
    expect(screen.getByText('0 / 0 registered')).toBeInTheDocument()
  })
})
