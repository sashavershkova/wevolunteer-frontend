import { describe, expect, it } from 'vitest'
import { calculateHoursContributed } from './calculateHoursContributed'
import type { Registration } from '../services/api/registrationService'

function makeRegistration(overrides: Partial<Registration> = {}): Registration {
  return {
    userId: 'user1',
    opportunityId: 'opp1',
    title: 'Test Opportunity',
    date: '2020-01-01',
    location: 'Seattle, WA',
    organizationId: 'org1',
    organizationName: 'Test Org',
    registrationStatus: 'ACTIVE',
    volunteerName: 'Test Volunteer',
    email: 'test@example.com',
    registeredAt: '2019-12-01T00:00:00Z',
    ...overrides,
  }
}

describe('calculateHoursContributed', () => {
  it('sums hours for completed registrations with startTime and endTime', () => {
    const registrations = [
      makeRegistration({ date: '2020-01-01', startTime: '09:00', endTime: '13:00' }),
      makeRegistration({ date: '2020-01-02', startTime: '10:00', endTime: '12:30' }),
    ]

    expect(calculateHoursContributed(registrations)).toBe(6.5)
  })

  it('ignores upcoming registrations even if they have times', () => {
    const farFuture = new Date()
    farFuture.setFullYear(farFuture.getFullYear() + 1)
    const futureDate = farFuture.toISOString().slice(0, 10)

    const registrations = [
      makeRegistration({ date: futureDate, startTime: '09:00', endTime: '17:00' }),
    ]

    expect(calculateHoursContributed(registrations)).toBe(0)
  })

  it('skips completed registrations missing startTime or endTime', () => {
    const registrations = [
      makeRegistration({ date: '2020-01-01', startTime: '09:00', endTime: null }),
      makeRegistration({ date: '2020-01-01', startTime: undefined, endTime: '13:00' }),
      makeRegistration({ date: '2020-01-01' }),
    ]

    expect(calculateHoursContributed(registrations)).toBe(0)
  })

  it('skips a registration with an invalid or reversed time range', () => {
    const registrations = [
      makeRegistration({ date: '2020-01-01', startTime: '14:00', endTime: '09:00' }),
    ]

    expect(calculateHoursContributed(registrations)).toBe(0)
  })

  it('rounds the total to one decimal place', () => {
    const registrations = [
      makeRegistration({ date: '2020-01-01', startTime: '09:00', endTime: '09:20' }),
    ]

    expect(calculateHoursContributed(registrations)).toBe(0.3)
  })

  it('returns 0 for an empty list', () => {
    expect(calculateHoursContributed([])).toBe(0)
  })
})