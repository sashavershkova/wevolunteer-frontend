import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
  filterOrganizationOpportunities,
} from './organizationOpportunityFilters'
import { opp1 } from '../tests/fixtures/opportunities'
import type { Opportunity } from '../types/Opportunity'

const MOCKED_TODAY = '2026-01-01T00:00:00'

function makeOpportunity(overrides: Partial<Opportunity>): Opportunity {
  return { ...opp1, ...overrides }
}

describe('filterOrganizationOpportunities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const open = makeOpportunity({ opportunityId: 'open', date: '2026-07-10', status: 'OPEN' })
  const closed = makeOpportunity({ opportunityId: 'closed', date: '2026-07-15', status: 'CLOSED' })
  const completed = makeOpportunity({
    opportunityId: 'completed',
    date: '2025-06-01',
    status: 'OPEN',
  })
  const all = [open, closed, completed]

  it('returns everything when status filter is ALL', () => {
    const result = filterOrganizationOpportunities(all, EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS)
    expect(result).toHaveLength(3)
  })

  it('filters by OPEN status', () => {
    const result = filterOrganizationOpportunities(all, {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      status: 'OPEN',
    })
    expect(result.map((o) => o.opportunityId)).toEqual(['open'])
  })

  it('filters by CLOSED status', () => {
    const result = filterOrganizationOpportunities(all, {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      status: 'CLOSED',
    })
    expect(result.map((o) => o.opportunityId)).toEqual(['closed'])
  })

  it('includes a past-dated CLOSED opportunity in the CLOSED filter - stored status takes precedence over date', () => {
    const pastClosed = makeOpportunity({
      opportunityId: 'past-closed',
      date: '2020-01-01',
      status: 'CLOSED',
    })

    const result = filterOrganizationOpportunities([pastClosed, completed], {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      status: 'CLOSED',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['past-closed'])
  })

  it('filters by COMPLETED status', () => {
    const result = filterOrganizationOpportunities(all, {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      status: 'COMPLETED',
    })
    expect(result.map((o) => o.opportunityId)).toEqual(['completed'])
  })

  it('is case-safe when comparing status', () => {
    const lowercaseClosed = makeOpportunity({
      opportunityId: 'lowercase-closed',
      date: '2026-07-15',
      status: 'closed' as Opportunity['status'],
    })

    const result = filterOrganizationOpportunities([lowercaseClosed], {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      status: 'CLOSED',
    })

    expect(result).toHaveLength(1)
  })

  it('filters by category', () => {
    const foodOpp = makeOpportunity({ opportunityId: 'food', category: 'Food' })
    const envOpp = makeOpportunity({ opportunityId: 'env', category: 'Environment' })

    const result = filterOrganizationOpportunities([foodOpp, envOpp], {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      category: 'Food',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['food'])
  })

  it('filters by location', () => {
    const seattleOpp = makeOpportunity({ opportunityId: 'seattle', location: 'Seattle, WA' })
    const bellevueOpp = makeOpportunity({ opportunityId: 'bellevue', location: 'Bellevue, WA' })

    const result = filterOrganizationOpportunities([seattleOpp, bellevueOpp], {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      location: 'Bellevue, WA',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['bellevue'])
  })

  it('filters by date range', () => {
    const result = filterOrganizationOpportunities(all, {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })

    expect(result.map((o) => o.opportunityId).sort()).toEqual(['closed', 'open'].sort())
  })

  it('combines multiple filters with AND semantics', () => {
    const result = filterOrganizationOpportunities(all, {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      status: 'OPEN',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['open'])
  })

  it('returns an empty array when nothing matches', () => {
    const result = filterOrganizationOpportunities(all, {
      ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS,
      category: 'Nonexistent Category',
    })

    expect(result).toEqual([])
  })

  it('does not mutate the original array', () => {
    const originalIds = all.map((o) => o.opportunityId)
    filterOrganizationOpportunities(all, { ...EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS, status: 'OPEN' })
    expect(all.map((o) => o.opportunityId)).toEqual(originalIds)
  })
})
