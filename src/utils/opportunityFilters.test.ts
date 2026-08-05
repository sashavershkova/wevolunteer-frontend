import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EMPTY_FILTERS,
  filterOpportunities,
  getUniqueSortedValues,
} from './opportunityFilters'
import { opp1, opp2, opp3 } from '../tests/fixtures/opportunities'
import type { Opportunity } from '../types/Opportunity'

const allOpportunities = [opp1, opp2, opp3]

function makeOpportunity(overrides: Partial<Opportunity>): Opportunity {
  return { ...opp1, ...overrides }
}

describe('filterOpportunities', () => {
  it('returns everything when no filters are set', () => {
    const result = filterOpportunities(allOpportunities, EMPTY_FILTERS)

    expect(result).toEqual(allOpportunities)
  })

  it('filters by category', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      category: 'Food',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['opp1', 'opp2'])
  })

  it('filters by location', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      location: 'Bellevue, WA',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['opp3'])
  })

  it('filters by organization name', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      organizationName: 'Green City Cleanup',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['opp3'])
  })

  it('filters by a start date, including opportunities on that exact date', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      startDate: '2026-07-15',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['opp2', 'opp3'])
  })

  it('filters by an end date, including opportunities on that exact date', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      endDate: '2026-07-15',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['opp1', 'opp2'])
  })

  it('filters by a full date range', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      startDate: '2026-07-11',
      endDate: '2026-07-16',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['opp2'])
  })

  it('matches search against the title, case-insensitively', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      search: 'PARK',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['opp3'])
  })

  it('matches search against the description', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      search: 'food insecurity',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['opp2'])
  })

  it('combines multiple filters with AND logic', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      category: 'Food',
      search: 'donations',
    })

    expect(result.map((o) => o.opportunityId)).toEqual(['opp1'])
  })

  it('returns an empty array when nothing matches', () => {
    const result = filterOpportunities(allOpportunities, {
      ...EMPTY_FILTERS,
      category: 'Education',
    })

    expect(result).toEqual([])
  })
})

describe('filterOpportunities - excludeExpired', () => {
  const MOCKED_TODAY = '2026-07-15T12:00:00'

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const yesterday = makeOpportunity({ opportunityId: 'yesterday', date: '2026-07-14' })
  const today = makeOpportunity({ opportunityId: 'today', date: '2026-07-15' })
  const future = makeOpportunity({ opportunityId: 'future', date: '2026-07-16' })
  const all = [yesterday, today, future]

  it('leaves everything in place when the option is not passed', () => {
    const result = filterOpportunities(all, EMPTY_FILTERS)

    expect(result.map((o) => o.opportunityId)).toEqual(['yesterday', 'today', 'future'])
  })

  it('excludes a past-dated opportunity when excludeExpired is true', () => {
    const result = filterOpportunities(all, EMPTY_FILTERS, { excludeExpired: true })

    expect(result.map((o) => o.opportunityId)).toEqual(['today', 'future'])
  })

  it('combines excludeExpired with other filters', () => {
    const pastFood = makeOpportunity({
      opportunityId: 'past-food',
      date: '2026-07-14',
      category: 'Food',
    })
    const futureFood = makeOpportunity({
      opportunityId: 'future-food',
      date: '2026-07-16',
      category: 'Food',
    })
    const futureEnv = makeOpportunity({
      opportunityId: 'future-env',
      date: '2026-07-16',
      category: 'Environment',
    })

    const result = filterOpportunities(
      [pastFood, futureFood, futureEnv],
      { ...EMPTY_FILTERS, category: 'Food' },
      { excludeExpired: true },
    )

    expect(result.map((o) => o.opportunityId)).toEqual(['future-food'])
  })

  it('returns an empty array when every opportunity is expired', () => {
    const result = filterOpportunities([yesterday], EMPTY_FILTERS, { excludeExpired: true })

    expect(result).toEqual([])
  })
})

describe('getUniqueSortedValues', () => {
  it('returns unique, alphabetically sorted category values', () => {
    expect(getUniqueSortedValues(allOpportunities, 'category')).toEqual([
      'Environment',
      'Food',
    ])
  })

  it('returns unique, alphabetically sorted location values', () => {
    expect(getUniqueSortedValues(allOpportunities, 'location')).toEqual([
      'Bellevue, WA',
      'Seattle, WA',
    ])
  })

  it('returns unique, alphabetically sorted organization names', () => {
    expect(getUniqueSortedValues(allOpportunities, 'organizationName')).toEqual([
      'Green City Cleanup',
      'Seattle Food Bank',
    ])
  })

  it('returns an empty array when given no opportunities', () => {
    expect(getUniqueSortedValues([], 'category')).toEqual([])
  })
})