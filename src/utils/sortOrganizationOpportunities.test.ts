import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sortOrganizationOpportunities } from './sortOrganizationOpportunities'
import { opp1 } from '../tests/fixtures/opportunities'
import type { Opportunity } from '../types/Opportunity'

const MOCKED_TODAY = '2026-01-01T00:00:00'

function makeOpportunity(overrides: Partial<Opportunity>): Opportunity {
  return { ...opp1, ...overrides }
}

describe('sortOrganizationOpportunities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not mutate the original array', () => {
    const original = [
      makeOpportunity({ opportunityId: 'a', date: '2026-07-10', status: 'OPEN' }),
      makeOpportunity({ opportunityId: 'b', date: '2026-07-01', status: 'OPEN' }),
    ]
    const originalOrder = original.map((opportunity) => opportunity.opportunityId)

    sortOrganizationOpportunities(original)

    expect(original.map((opportunity) => opportunity.opportunityId)).toEqual(originalOrder)
  })

  it('places non-CLOSED opportunities before CLOSED ones', () => {
    const closed = makeOpportunity({
      opportunityId: 'closed',
      date: '2026-07-01',
      status: 'CLOSED',
    })
    const open = makeOpportunity({
      opportunityId: 'open',
      date: '2026-07-20',
      status: 'OPEN',
    })

    const result = sortOrganizationOpportunities([closed, open])

    expect(result.map((opportunity) => opportunity.opportunityId)).toEqual(['open', 'closed'])
  })

  it('keeps CLOSED opportunities at the bottom even when their date is earlier than open ones', () => {
    const closedEarly = makeOpportunity({
      opportunityId: 'closed-early',
      date: '2026-01-05',
      status: 'CLOSED',
    })
    const openLate = makeOpportunity({
      opportunityId: 'open-late',
      date: '2026-12-01',
      status: 'OPEN',
    })

    const result = sortOrganizationOpportunities([closedEarly, openLate])

    expect(result.map((opportunity) => opportunity.opportunityId)).toEqual([
      'open-late',
      'closed-early',
    ])
  })

  it('keeps a past CLOSED opportunity below every OPEN and COMPLETED opportunity', () => {
    const pastClosed = makeOpportunity({
      opportunityId: 'past-closed',
      title: 'Past Closed Shift',
      date: '2020-01-01',
      status: 'CLOSED',
    })
    const futureOpen = makeOpportunity({
      opportunityId: 'future-open',
      title: 'Future Open Shift',
      date: '2026-12-01',
      status: 'OPEN',
    })
    const pastOpenCompleted = makeOpportunity({
      opportunityId: 'past-open-completed',
      title: 'Past Open Shift',
      date: '2025-01-01',
      status: 'OPEN',
    })

    const result = sortOrganizationOpportunities([pastClosed, futureOpen, pastOpenCompleted])

    expect(result.map((opportunity) => opportunity.opportunityId)).toEqual([
      'future-open',
      'past-open-completed',
      'past-closed',
    ])
  })

  it('orders groups as OPEN, then COMPLETED, then CLOSED regardless of date', () => {
    const closed = makeOpportunity({
      opportunityId: 'closed',
      date: '2020-01-01',
      status: 'CLOSED',
    })
    const completed = makeOpportunity({
      opportunityId: 'completed',
      date: '2025-01-01',
      status: 'OPEN',
    })
    const open = makeOpportunity({
      opportunityId: 'open',
      date: '2026-12-01',
      status: 'OPEN',
    })

    const result = sortOrganizationOpportunities([closed, completed, open])

    expect(result.map((opportunity) => opportunity.opportunityId)).toEqual([
      'open',
      'completed',
      'closed',
    ])
  })

  it('sorts opportunities within a group by date ascending', () => {
    const later = makeOpportunity({ opportunityId: 'later', date: '2026-08-01', status: 'OPEN' })
    const earlier = makeOpportunity({ opportunityId: 'earlier', date: '2026-07-01', status: 'OPEN' })

    const result = sortOrganizationOpportunities([later, earlier])

    expect(result.map((opportunity) => opportunity.opportunityId)).toEqual(['earlier', 'later'])
  })

  it('uses startTime as a secondary sort when dates are equal', () => {
    const laterTime = makeOpportunity({
      opportunityId: 'later-time',
      date: '2026-07-01',
      startTime: '15:00',
      status: 'OPEN',
    })
    const earlierTime = makeOpportunity({
      opportunityId: 'earlier-time',
      date: '2026-07-01',
      startTime: '09:00',
      status: 'OPEN',
    })

    const result = sortOrganizationOpportunities([laterTime, earlierTime])

    expect(result.map((opportunity) => opportunity.opportunityId)).toEqual([
      'earlier-time',
      'later-time',
    ])
  })

  it('falls back to title when date and startTime are equal', () => {
    const zebra = makeOpportunity({
      opportunityId: 'zebra',
      title: 'Zebra Shift',
      date: '2026-07-01',
      startTime: '09:00',
      status: 'OPEN',
    })
    const alpha = makeOpportunity({
      opportunityId: 'alpha',
      title: 'Alpha Shift',
      date: '2026-07-01',
      startTime: '09:00',
      status: 'OPEN',
    })

    const result = sortOrganizationOpportunities([zebra, alpha])

    expect(result.map((opportunity) => opportunity.opportunityId)).toEqual(['alpha', 'zebra'])
  })

  it('does not crash on invalid or missing dates and sorts them after valid dates in the same group', () => {
    const valid = makeOpportunity({ opportunityId: 'valid', date: '2026-07-01', status: 'OPEN' })
    const invalid = makeOpportunity({
      opportunityId: 'invalid',
      date: 'not-a-date',
      status: 'OPEN',
    })
    const missing = makeOpportunity({
      opportunityId: 'missing',
      date: '' as Opportunity['date'],
      status: 'OPEN',
    })

    const result = sortOrganizationOpportunities([invalid, missing, valid])

    expect(() => sortOrganizationOpportunities([invalid, missing, valid])).not.toThrow()
    expect(result[0].opportunityId).toBe('valid')
    expect(result.map((opportunity) => opportunity.opportunityId).slice(1).sort()).toEqual(
      ['invalid', 'missing'].sort(),
    )
  })
})
