import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
  filterRegistrationOpportunities,
  type RegistrationOpportunityItem,
} from './registrationOpportunityFilters'
import { opp1, opp3, opp7 } from '../tests/fixtures/opportunities'
import type { Opportunity } from '../types/Opportunity'
import type { Registration } from '../services/api/registrationService'

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

function makeItem(overrides: Partial<RegistrationOpportunityItem> = {}): RegistrationOpportunityItem {
  return {
    opportunity: opp1,
    registrations: [],
    isLoading: false,
    error: null,
    ...overrides,
  }
}

describe('filterRegistrationOpportunities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not mutate the original array', () => {
    const items = [makeItem()]
    filterRegistrationOpportunities(items, EMPTY_REGISTRATION_OPPORTUNITY_FILTERS)
    expect(items).toHaveLength(1)
  })

  it('matches search against the opportunity title', () => {
    const items = [
      makeItem({ opportunity: opp1 }),
      makeItem({ opportunity: opp3 }),
    ]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      search: 'Food Bank',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp1.opportunityId])
  })

  it('matches search against the opportunity location', () => {
    const items = [
      makeItem({ opportunity: opp1 }), // Seattle, WA
      makeItem({ opportunity: opp3 }), // Bellevue, WA
    ]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      search: 'bellevue',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp3.opportunityId])
  })

  it('matches search against a volunteer name and shows the whole card', () => {
    const items = [
      makeItem({
        opportunity: opp1,
        registrations: [makeRegistration({ volunteerName: 'Mariya Petrova' })],
      }),
      makeItem({ opportunity: opp3, registrations: [] }),
    ]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      search: 'mariya',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp1.opportunityId])
  })

  it('matches search against a volunteer email', () => {
    const items = [
      makeItem({
        opportunity: opp1,
        registrations: [makeRegistration({ email: 'unique-address@example.com' })],
      }),
      makeItem({ opportunity: opp3, registrations: [] }),
    ]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      search: 'unique-address',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp1.opportunityId])
  })

  it('is case-insensitive', () => {
    const items = [makeItem({ opportunity: opp1 })]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      search: 'FOOD BANK',
    })

    expect(result).toHaveLength(1)
  })

  it('filters by OPEN status using getOpportunityDisplayStatus', () => {
    const items = [makeItem({ opportunity: opp1 }), makeItem({ opportunity: opp7 })]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      status: 'OPEN',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp1.opportunityId])
  })

  it('filters by CLOSED status', () => {
    const items = [makeItem({ opportunity: opp1 }), makeItem({ opportunity: opp7 })]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      status: 'CLOSED',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp7.opportunityId])
  })

  it('filters by COMPLETED status', () => {
    const completedOpportunity: Opportunity = { ...opp1, date: '2025-01-01' }
    const items = [
      makeItem({ opportunity: completedOpportunity }),
      makeItem({ opportunity: opp3 }),
    ]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      status: 'COMPLETED',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([
      completedOpportunity.opportunityId,
    ])
  })

  it('filters by date range using inclusive string comparison', () => {
    const items = [makeItem({ opportunity: opp1 }), makeItem({ opportunity: opp3 })]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      startDate: '2026-07-01',
      endDate: '2026-07-10',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp1.opportunityId])
  })

  it('filters by With Registrations using the actual registration array, not registeredCount', () => {
    const items = [
      makeItem({
        opportunity: { ...opp1, registeredCount: 0 },
        registrations: [makeRegistration({})],
      }),
      makeItem({ opportunity: opp3, registrations: [] }),
    ]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      registrationState: 'WITH_REGISTRATIONS',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp1.opportunityId])
  })

  it('excludes a still-loading opportunity from No Registrations', () => {
    const items = [
      makeItem({ opportunity: opp1, registrations: [], isLoading: true }),
      makeItem({ opportunity: opp3, registrations: [] }),
    ]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      registrationState: 'NO_REGISTRATIONS',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp3.opportunityId])
  })

  it('excludes an errored opportunity from No Registrations', () => {
    const items = [
      makeItem({ opportunity: opp1, registrations: [], error: 'Unable to load registered volunteers: 500' }),
      makeItem({ opportunity: opp3, registrations: [] }),
    ]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      registrationState: 'NO_REGISTRATIONS',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp3.opportunityId])
  })

  it('combines multiple filters with AND semantics', () => {
    const items = [
      makeItem({
        opportunity: opp1,
        registrations: [makeRegistration({ volunteerName: 'Mariya Petrova' })],
      }),
      makeItem({ opportunity: opp3, registrations: [makeRegistration({})] }),
    ]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      status: 'OPEN',
      registrationState: 'WITH_REGISTRATIONS',
      search: 'mariya',
    })

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([opp1.opportunityId])
  })

  it('preserves the input order (OPEN/COMPLETED/CLOSED ordering is the caller’s responsibility)', () => {
    const items = [makeItem({ opportunity: opp3 }), makeItem({ opportunity: opp1 })]

    const result = filterRegistrationOpportunities(items, EMPTY_REGISTRATION_OPPORTUNITY_FILTERS)

    expect(result.map((item) => item.opportunity.opportunityId)).toEqual([
      opp3.opportunityId,
      opp1.opportunityId,
    ])
  })

  it('returns an empty array when nothing matches', () => {
    const items = [makeItem({ opportunity: opp1 })]

    const result = filterRegistrationOpportunities(items, {
      ...EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
      search: 'no such opportunity',
    })

    expect(result).toEqual([])
  })
})
