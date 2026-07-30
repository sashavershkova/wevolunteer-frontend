import { describe, expect, it } from 'vitest'
import { sortRegistrations } from './sortRegistrations'
import type { Registration } from '../services/api/registrationService'

function makeRegistration(overrides: Partial<Registration>): Registration {
  return {
    userId: 'user-1',
    opportunityId: 'opp1',
    title: 'Food Bank Volunteer Shift',
    date: '2026-07-10',
    location: 'Seattle, WA',
    organizationId: 'org1',
    organizationName: 'Seattle Food Bank',
    registrationStatus: 'ACTIVE',
    volunteerName: 'Volunteer',
    email: 'volunteer@example.com',
    registeredAt: '2026-06-01T10:00:00',
    ...overrides,
  }
}

describe('sortRegistrations', () => {
  it('does not mutate the original array', () => {
    const original = [
      makeRegistration({ userId: 'a', registeredAt: '2026-06-02T10:00:00' }),
      makeRegistration({ userId: 'b', registeredAt: '2026-06-01T10:00:00' }),
    ]
    const originalOrder = original.map((registration) => registration.userId)

    sortRegistrations(original)

    expect(original.map((registration) => registration.userId)).toEqual(originalOrder)
  })

  it('sorts by registeredAt ascending, oldest first', () => {
    const later = makeRegistration({ userId: 'later', registeredAt: '2026-06-05T10:00:00' })
    const earlier = makeRegistration({ userId: 'earlier', registeredAt: '2026-06-01T10:00:00' })

    const result = sortRegistrations([later, earlier])

    expect(result.map((registration) => registration.userId)).toEqual(['earlier', 'later'])
  })

  it('falls back to volunteerName alphabetically when registeredAt ties', () => {
    const zebra = makeRegistration({
      userId: 'zebra',
      volunteerName: 'Zebra Volunteer',
      registeredAt: '2026-06-01T10:00:00',
    })
    const alpha = makeRegistration({
      userId: 'alpha',
      volunteerName: 'Alpha Volunteer',
      registeredAt: '2026-06-01T10:00:00',
    })

    const result = sortRegistrations([zebra, alpha])

    expect(result.map((registration) => registration.userId)).toEqual(['alpha', 'zebra'])
  })

  it('falls back to original order when registeredAt and volunteerName both tie', () => {
    const first = makeRegistration({
      userId: 'first',
      volunteerName: 'Same Name',
      registeredAt: '2026-06-01T10:00:00',
    })
    const second = makeRegistration({
      userId: 'second',
      volunteerName: 'Same Name',
      registeredAt: '2026-06-01T10:00:00',
    })

    const result = sortRegistrations([first, second])

    expect(result.map((registration) => registration.userId)).toEqual(['first', 'second'])
  })

  it('does not crash on an unusable registeredAt value and sorts it after valid ones', () => {
    const valid = makeRegistration({ userId: 'valid', registeredAt: '2026-06-01T10:00:00' })
    const invalid = makeRegistration({ userId: 'invalid', registeredAt: 'not-a-date' })

    expect(() => sortRegistrations([invalid, valid])).not.toThrow()

    const result = sortRegistrations([invalid, valid])
    expect(result.map((registration) => registration.userId)).toEqual(['valid', 'invalid'])
  })

  it('treats a missing volunteerName as an empty string for sorting purposes', () => {
    const named = makeRegistration({
      userId: 'named',
      volunteerName: 'Anna',
      registeredAt: '2026-06-01T10:00:00',
    })
    const unnamed = makeRegistration({
      userId: 'unnamed',
      volunteerName: null,
      registeredAt: '2026-06-01T10:00:00',
    })

    const result = sortRegistrations([named, unnamed])

    expect(result.map((registration) => registration.userId)).toEqual(['unnamed', 'named'])
  })
})
