import { describe, expect, it } from 'vitest'
import {
  EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
  filterAndSortOrganizationVolunteers,
  filterOrganizationVolunteers,
  sortOrganizationVolunteers,
} from './organizationVolunteerFilters'
import type { OrganizationVolunteer } from './aggregateOrganizationVolunteers'

function makeVolunteer(overrides: Partial<OrganizationVolunteer>): OrganizationVolunteer {
  return {
    userId: 'user-1',
    name: 'John Smith',
    email: 'john@example.com',
    registrationCount: 1,
    opportunityIds: ['opp1'],
    firstRegisteredAt: '2026-06-01T10:00:00',
    mostRecentRegisteredAt: '2026-06-01T10:00:00',
    upcomingRegistrationCount: 1,
    status: 'NEW',
    ...overrides,
  }
}

describe('filterOrganizationVolunteers', () => {
  it('does not mutate the source array', () => {
    const volunteers = [makeVolunteer({})]
    filterOrganizationVolunteers(volunteers, EMPTY_ORGANIZATION_VOLUNTEER_FILTERS)
    expect(volunteers).toHaveLength(1)
  })

  it('matches search against the volunteer name', () => {
    const volunteers = [
      makeVolunteer({ userId: 'a', name: 'Mariya Petrova' }),
      makeVolunteer({ userId: 'b', name: 'John Smith' }),
    ]

    const result = filterOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      search: 'mariya',
    })

    expect(result.map((v) => v.userId)).toEqual(['a'])
  })

  it('matches search against the volunteer email', () => {
    const volunteers = [
      makeVolunteer({ userId: 'a', email: 'unique-address@example.com' }),
      makeVolunteer({ userId: 'b', email: 'other@example.com' }),
    ]

    const result = filterOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      search: 'unique-address',
    })

    expect(result.map((v) => v.userId)).toEqual(['a'])
  })

  it('is case-insensitive', () => {
    const volunteers = [makeVolunteer({ name: 'John Smith' })]

    const result = filterOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      search: 'JOHN',
    })

    expect(result).toHaveLength(1)
  })

  it('filters by New status', () => {
    const volunteers = [
      makeVolunteer({ userId: 'a', status: 'NEW' }),
      makeVolunteer({ userId: 'b', status: 'RETURNING' }),
    ]

    const result = filterOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      status: 'NEW',
    })

    expect(result.map((v) => v.userId)).toEqual(['a'])
  })

  it('filters by Returning status', () => {
    const volunteers = [
      makeVolunteer({ userId: 'a', status: 'NEW' }),
      makeVolunteer({ userId: 'b', status: 'RETURNING' }),
    ]

    const result = filterOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      status: 'RETURNING',
    })

    expect(result.map((v) => v.userId)).toEqual(['b'])
  })

  it('filters by Frequent status', () => {
    const volunteers = [
      makeVolunteer({ userId: 'a', status: 'FREQUENT' }),
      makeVolunteer({ userId: 'b', status: 'RETURNING' }),
    ]

    const result = filterOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      status: 'FREQUENT',
    })

    expect(result.map((v) => v.userId)).toEqual(['a'])
  })

  it('finds volunteers with an upcoming registration', () => {
    const volunteers = [
      makeVolunteer({ userId: 'a', upcomingRegistrationCount: 1 }),
      makeVolunteer({ userId: 'b', upcomingRegistrationCount: 0 }),
    ]

    const result = filterOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      activity: 'HAS_UPCOMING',
    })

    expect(result.map((v) => v.userId)).toEqual(['a'])
  })

  it('finds volunteers with registration history only (no upcoming)', () => {
    const volunteers = [
      makeVolunteer({ userId: 'a', upcomingRegistrationCount: 1 }),
      makeVolunteer({ userId: 'b', upcomingRegistrationCount: 0 }),
    ]

    const result = filterOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      activity: 'HISTORY_ONLY',
    })

    expect(result.map((v) => v.userId)).toEqual(['b'])
  })

  it('combines multiple filters with AND semantics', () => {
    const volunteers = [
      makeVolunteer({ userId: 'a', name: 'Mariya Petrova', status: 'FREQUENT', upcomingRegistrationCount: 1 }),
      makeVolunteer({ userId: 'b', name: 'Mariya Ivanova', status: 'NEW', upcomingRegistrationCount: 1 }),
    ]

    const result = filterOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      search: 'mariya',
      status: 'FREQUENT',
      activity: 'HAS_UPCOMING',
    })

    expect(result.map((v) => v.userId)).toEqual(['a'])
  })

  it('restores all volunteers when filters are empty', () => {
    const volunteers = [makeVolunteer({ userId: 'a' }), makeVolunteer({ userId: 'b' })]

    const result = filterOrganizationVolunteers(volunteers, EMPTY_ORGANIZATION_VOLUNTEER_FILTERS)

    expect(result).toHaveLength(2)
  })
})

describe('sortOrganizationVolunteers', () => {
  it('does not mutate the source array', () => {
    const volunteers = [makeVolunteer({ userId: 'a' }), makeVolunteer({ userId: 'b' })]
    sortOrganizationVolunteers(volunteers, 'MOST_REGISTRATIONS')
    expect(volunteers.map((v) => v.userId)).toEqual(['a', 'b'])
  })

  it('defaults to Most Registrations sorting', () => {
    const volunteers = [
      makeVolunteer({ userId: 'few', registrationCount: 1 }),
      makeVolunteer({ userId: 'many', registrationCount: 3 }),
    ]

    const result = sortOrganizationVolunteers(volunteers, 'MOST_REGISTRATIONS')

    expect(result.map((v) => v.userId)).toEqual(['many', 'few'])
  })

  it('sorts by most recently registered', () => {
    const volunteers = [
      makeVolunteer({ userId: 'older', mostRecentRegisteredAt: '2026-06-01T10:00:00' }),
      makeVolunteer({ userId: 'newer', mostRecentRegisteredAt: '2026-06-05T10:00:00' }),
    ]

    const result = sortOrganizationVolunteers(volunteers, 'MOST_RECENT')

    expect(result.map((v) => v.userId)).toEqual(['newer', 'older'])
  })

  it('sorts by name A-Z', () => {
    const volunteers = [
      makeVolunteer({ userId: 'z', name: 'Zoe' }),
      makeVolunteer({ userId: 'a', name: 'Anna' }),
    ]

    const result = sortOrganizationVolunteers(volunteers, 'NAME_ASC')

    expect(result.map((v) => v.userId)).toEqual(['a', 'z'])
  })

  it('breaks Most Registrations ties by most recent registration, then name, then original order', () => {
    const volunteers = [
      makeVolunteer({
        userId: 'zebra-recent',
        name: 'Zebra',
        registrationCount: 2,
        mostRecentRegisteredAt: '2026-06-05T10:00:00',
      }),
      makeVolunteer({
        userId: 'anna-older',
        name: 'Anna',
        registrationCount: 2,
        mostRecentRegisteredAt: '2026-06-01T10:00:00',
      }),
    ]

    const result = sortOrganizationVolunteers(volunteers, 'MOST_REGISTRATIONS')

    // Same registrationCount, so the more recently active volunteer wins the tie
    // regardless of name.
    expect(result.map((v) => v.userId)).toEqual(['zebra-recent', 'anna-older'])
  })

  it('is deterministic for volunteers tied on every criterion (stable original order)', () => {
    const volunteers = [
      makeVolunteer({
        userId: 'first',
        name: 'Same Name',
        registrationCount: 1,
        mostRecentRegisteredAt: '2026-06-01T10:00:00',
      }),
      makeVolunteer({
        userId: 'second',
        name: 'Same Name',
        registrationCount: 1,
        mostRecentRegisteredAt: '2026-06-01T10:00:00',
      }),
    ]

    const result = sortOrganizationVolunteers(volunteers, 'MOST_REGISTRATIONS')

    expect(result.map((v) => v.userId)).toEqual(['first', 'second'])
  })
})

describe('filterAndSortOrganizationVolunteers', () => {
  it('applies filters before sorting', () => {
    const volunteers = [
      makeVolunteer({ userId: 'a', name: 'Anna', status: 'NEW', registrationCount: 1 }),
      makeVolunteer({ userId: 'b', name: 'Boris', status: 'FREQUENT', registrationCount: 5 }),
    ]

    const result = filterAndSortOrganizationVolunteers(volunteers, {
      ...EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
      status: 'NEW',
    })

    expect(result.map((v) => v.userId)).toEqual(['a'])
  })
})
