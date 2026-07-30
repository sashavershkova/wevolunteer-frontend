import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UpcomingOpportunityList from './UpcomingOpportunityList'
import { opp1 } from '../../../tests/fixtures/opportunities'
import type { Opportunity } from '../../../types/Opportunity'

const MOCKED_TODAY = '2026-01-01T00:00:00'

function makeOpportunity(overrides: Partial<Opportunity>): Opportunity {
  return { ...opp1, ...overrides }
}

function renderList(props: Partial<ComponentProps<typeof UpcomingOpportunityList>> = {}) {
  return render(
    <MemoryRouter>
      <UpcomingOpportunityList opportunities={[]} {...props} />
    </MemoryRouter>,
  )
}

describe('UpcomingOpportunityList', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a loading message while loading', () => {
    renderList({ isLoading: true })

    expect(screen.getByRole('status')).toHaveTextContent('Loading upcoming opportunities...')
  })

  it('shows an error message when loading fails', () => {
    renderList({ error: 'Unable to load your opportunities.' })

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load your opportunities.')
  })

  it('shows an empty state with a Create action when there are no opportunities at all', () => {
    renderList({ opportunities: [] })

    expect(screen.getByText('You have no upcoming opportunities.')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Create your first opportunity' }),
    ).toHaveAttribute('href', '/organization/opportunities/new')
  })

  it('includes only OPEN opportunities', () => {
    const open = makeOpportunity({
      opportunityId: 'open',
      title: 'Open Shift',
      date: '2026-07-10',
      status: 'OPEN',
    })
    const closed = makeOpportunity({
      opportunityId: 'closed',
      title: 'Closed Shift',
      date: '2026-07-15',
      status: 'CLOSED',
    })

    renderList({ opportunities: [open, closed] })

    expect(screen.getByText(open.title)).toBeInTheDocument()
    expect(screen.queryByText(closed.title)).not.toBeInTheDocument()
  })

  it('excludes COMPLETED (past OPEN) opportunities', () => {
    const upcoming = makeOpportunity({
      opportunityId: 'upcoming',
      title: 'Upcoming Shift',
      date: '2026-07-10',
      status: 'OPEN',
    })
    const completed = makeOpportunity({
      opportunityId: 'completed',
      title: 'Completed Shift',
      date: '2025-01-01',
      status: 'OPEN',
    })

    renderList({ opportunities: [upcoming, completed] })

    expect(screen.getByText(upcoming.title)).toBeInTheDocument()
    expect(screen.queryByText(completed.title)).not.toBeInTheDocument()
  })

  it('excludes CLOSED opportunities even when past', () => {
    const upcoming = makeOpportunity({
      opportunityId: 'upcoming',
      title: 'Upcoming Shift',
      date: '2026-07-10',
      status: 'OPEN',
    })
    const pastClosed = makeOpportunity({
      opportunityId: 'past-closed',
      title: 'Past Closed Shift',
      date: '2025-01-01',
      status: 'CLOSED',
    })

    renderList({ opportunities: [upcoming, pastClosed] })

    expect(screen.getByText(upcoming.title)).toBeInTheDocument()
    expect(screen.queryByText(pastClosed.title)).not.toBeInTheDocument()
  })

  it('orders opportunities chronologically', () => {
    const later = makeOpportunity({
      opportunityId: 'later',
      title: 'Later Shift',
      date: '2026-08-01',
      status: 'OPEN',
    })
    const earlier = makeOpportunity({
      opportunityId: 'earlier',
      title: 'Earlier Shift',
      date: '2026-07-01',
      status: 'OPEN',
    })

    renderList({ opportunities: [later, earlier] })

    const titles = screen.getAllByRole('link', { name: /Shift/ }).map((link) => link.textContent)
    expect(titles).toEqual(['Earlier Shift', 'Later Shift'])
  })

  it('shows only the configured maximum number of items', () => {
    const opportunities = [1, 2, 3, 4, 5].map((day) =>
      makeOpportunity({
        opportunityId: `opp-${day}`,
        title: `Shift ${day}`,
        date: `2026-07-0${day}`,
        status: 'OPEN',
      }),
    )

    renderList({ opportunities, maxItems: 3 })

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Shift 1')).toBeInTheDocument()
    expect(screen.getByText('Shift 2')).toBeInTheDocument()
    expect(screen.getByText('Shift 3')).toBeInTheDocument()
    expect(screen.queryByText('Shift 4')).not.toBeInTheDocument()
  })

  it('shows the formatted date, time, and registration count', () => {
    const opportunity = makeOpportunity({
      date: '2026-07-10',
      status: 'OPEN',
      startTime: '09:00',
      endTime: '12:00',
      registeredCount: 1,
      capacity: 10,
    })

    renderList({ opportunities: [opportunity] })

    expect(screen.getByText(/Jul 10, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/9:00 AM – 12:00 PM/)).toBeInTheDocument()
    expect(screen.getByText(/1 \/ 10 registered/)).toBeInTheDocument()
  })

  it('links each item to the organization opportunity details page', () => {
    const opportunity = makeOpportunity({ opportunityId: 'opp-1', date: '2026-07-10', status: 'OPEN' })

    renderList({ opportunities: [opportunity] })

    expect(screen.getByRole('link', { name: opportunity.title })).toHaveAttribute(
      'href',
      '/organization/opportunities/opp-1',
    )
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/organization/opportunities/opp-1',
    )
  })
})
