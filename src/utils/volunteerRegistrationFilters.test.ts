import { describe, expect, it } from 'vitest'
import {
  EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
  filterVolunteerRegistrations,
  getUniqueSortedVolunteerRegistrationValues,
} from './volunteerRegistrationFilters'
import type { Registration } from '../services/api/registrationService'

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

const opp1 = makeRegistration({ opportunityId: 'opp1' })
const opp2 = makeRegistration({
  opportunityId: 'opp2',
  title: 'Community Meal Prep',
  date: '2026-08-15',
})
const opp3 = makeRegistration({
  opportunityId: 'opp3',
  title: 'Park Cleanup Day',
  date: '2026-08-20',
  location: 'Bellevue, WA',
  organizationId: 'org2',
  organizationName: 'Green City Cleanup',
})

const allRegistrations = [opp1, opp2, opp3]

describe('filterVolunteerRegistrations', () => {
  it('returns everything when no filters are set', () => {
    expect(
      filterVolunteerRegistrations(allRegistrations, EMPTY_VOLUNTEER_REGISTRATION_FILTERS),
    ).toEqual(allRegistrations)
  })

  it('filters by location', () => {
    const result = filterVolunteerRegistrations(allRegistrations, {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      location: 'Bellevue, WA',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp3'])
  })

  it('filters by organization name', () => {
    const result = filterVolunteerRegistrations(allRegistrations, {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      organizationName: 'Green City Cleanup',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp3'])
  })

  it('filters by a start date, including the exact date', () => {
    const result = filterVolunteerRegistrations(allRegistrations, {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      startDate: '2026-08-15',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp2', 'opp3'])
  })

  it('filters by an end date, including the exact date', () => {
    const result = filterVolunteerRegistrations(allRegistrations, {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      endDate: '2026-08-15',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp1', 'opp2'])
  })

  it('matches search against the title, case-insensitively', () => {
    const result = filterVolunteerRegistrations(allRegistrations, {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      search: 'PARK',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp3'])
  })

  it('matches search against the organization name', () => {
    const result = filterVolunteerRegistrations(allRegistrations, {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      search: 'green city',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp3'])
  })

  it('matches search against "closed" for past-date registrations, as a synonym for Completed', () => {
    const past = makeRegistration({ opportunityId: 'opp-past', date: '2020-01-01' })
    const upcoming = makeRegistration({ opportunityId: 'opp-upcoming', date: '2099-01-01' })

    const result = filterVolunteerRegistrations([past, upcoming], {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      search: 'closed',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp-past'])
  })

  it('matches search against "completed" for past-date registrations', () => {
    const past = makeRegistration({ opportunityId: 'opp-past', date: '2020-01-01' })
    const upcoming = makeRegistration({ opportunityId: 'opp-upcoming', date: '2099-01-01' })

    const result = filterVolunteerRegistrations([past, upcoming], {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      search: 'completed',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp-past'])
  })

  it('matches search against "registered" for upcoming registrations, and excludes past ones', () => {
    const past = makeRegistration({ opportunityId: 'opp-past', date: '2020-01-01' })
    const upcoming = makeRegistration({ opportunityId: 'opp-upcoming', date: '2099-01-01' })

    const result = filterVolunteerRegistrations([past, upcoming], {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      search: 'registered',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp-upcoming'])
  })

  it('combines multiple filters with AND logic', () => {
    const result = filterVolunteerRegistrations(allRegistrations, {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      organizationName: 'Seattle Food Bank',
      search: 'community',
    })

    expect(result.map((r) => r.opportunityId)).toEqual(['opp2'])
  })

  it('returns an empty array when nothing matches', () => {
    const result = filterVolunteerRegistrations(allRegistrations, {
      ...EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
      location: 'Nowhere, WA',
    })

    expect(result).toEqual([])
  })
})

describe('getUniqueSortedVolunteerRegistrationValues', () => {
  it('returns unique, alphabetically sorted location values', () => {
    expect(getUniqueSortedVolunteerRegistrationValues(allRegistrations, 'location')).toEqual([
      'Bellevue, WA',
      'Seattle, WA',
    ])
  })

  it('returns unique, alphabetically sorted organization names', () => {
    expect(
      getUniqueSortedVolunteerRegistrationValues(allRegistrations, 'organizationName'),
    ).toEqual(['Green City Cleanup', 'Seattle Food Bank'])
  })

  it('returns an empty array when given no registrations', () => {
    expect(getUniqueSortedVolunteerRegistrationValues([], 'location')).toEqual([])
  })
})