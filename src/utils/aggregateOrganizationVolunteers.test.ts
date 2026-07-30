import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aggregateOrganizationVolunteers } from './aggregateOrganizationVolunteers'
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

describe('aggregateOrganizationVolunteers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not mutate the source arrays', () => {
    const registrations = [makeRegistration({})]
    const items = [{ opportunity: opp1, registrations }]

    aggregateOrganizationVolunteers(items)

    expect(items).toHaveLength(1)
    expect(registrations).toHaveLength(1)
  })

  it('groups multiple registrations with the same userId into one volunteer', () => {
    const items = [
      {
        opportunity: opp1,
        registrations: [makeRegistration({ userId: 'user-1', opportunityId: opp1.opportunityId })],
      },
      {
        opportunity: opp3,
        registrations: [
          makeRegistration({ userId: 'user-1', opportunityId: opp3.opportunityId }),
        ],
      },
    ]

    const result = aggregateOrganizationVolunteers(items)

    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('user-1')
  })

  it('counts distinct opportunity IDs as registrationCount', () => {
    const items = [
      { opportunity: opp1, registrations: [makeRegistration({ opportunityId: opp1.opportunityId })] },
      { opportunity: opp3, registrations: [makeRegistration({ opportunityId: opp3.opportunityId })] },
    ]

    const result = aggregateOrganizationVolunteers(items)

    expect(result[0].registrationCount).toBe(2)
    expect(result[0].opportunityIds.sort()).toEqual(
      [opp1.opportunityId, opp3.opportunityId].sort(),
    )
  })

  it('does not double-count duplicate records for the same user/opportunity', () => {
    const items = [
      {
        opportunity: opp1,
        registrations: [
          makeRegistration({ opportunityId: opp1.opportunityId, registeredAt: '2026-06-01T10:00:00' }),
          makeRegistration({ opportunityId: opp1.opportunityId, registeredAt: '2026-06-01T10:00:01' }),
        ],
      },
    ]

    const result = aggregateOrganizationVolunteers(items)

    expect(result[0].registrationCount).toBe(1)
  })

  it('produces NEW status for one distinct opportunity', () => {
    const items = [{ opportunity: opp1, registrations: [makeRegistration({})] }]
    expect(aggregateOrganizationVolunteers(items)[0].status).toBe('NEW')
  })

  it('produces RETURNING status for two distinct opportunities', () => {
    const items = [
      { opportunity: opp1, registrations: [makeRegistration({ opportunityId: opp1.opportunityId })] },
      { opportunity: opp3, registrations: [makeRegistration({ opportunityId: opp3.opportunityId })] },
    ]
    expect(aggregateOrganizationVolunteers(items)[0].status).toBe('RETURNING')
  })

  it('produces FREQUENT status for three or more distinct opportunities', () => {
    const items = [
      { opportunity: opp1, registrations: [makeRegistration({ opportunityId: opp1.opportunityId })] },
      { opportunity: opp3, registrations: [makeRegistration({ opportunityId: opp3.opportunityId })] },
      { opportunity: opp7, registrations: [makeRegistration({ opportunityId: opp7.opportunityId })] },
    ]
    expect(aggregateOrganizationVolunteers(items)[0].status).toBe('FREQUENT')
  })

  it('calculates the earliest and latest registeredAt values', () => {
    const items = [
      {
        opportunity: opp1,
        registrations: [
          makeRegistration({ opportunityId: opp1.opportunityId, registeredAt: '2026-06-05T10:00:00' }),
        ],
      },
      {
        opportunity: opp3,
        registrations: [
          makeRegistration({ opportunityId: opp3.opportunityId, registeredAt: '2026-06-01T10:00:00' }),
        ],
      },
    ]

    const result = aggregateOrganizationVolunteers(items)[0]

    expect(result.firstRegisteredAt).toBe('2026-06-01T10:00:00')
    expect(result.mostRecentRegisteredAt).toBe('2026-06-05T10:00:00')
  })

  it('ignores invalid registeredAt values without crashing', () => {
    const items = [
      {
        opportunity: opp1,
        registrations: [
          makeRegistration({ opportunityId: opp1.opportunityId, registeredAt: 'not-a-date' }),
        ],
      },
    ]

    expect(() => aggregateOrganizationVolunteers(items)).not.toThrow()
    const result = aggregateOrganizationVolunteers(items)[0]
    expect(result.firstRegisteredAt).toBeNull()
    expect(result.mostRecentRegisteredAt).toBeNull()
  })

  it('counts upcoming registrations using getOpportunityDisplayStatus', () => {
    const closedOpportunity: Opportunity = { ...opp1, status: 'CLOSED' }
    const items = [
      { opportunity: opp1, registrations: [makeRegistration({ opportunityId: opp1.opportunityId })] },
      {
        opportunity: closedOpportunity,
        registrations: [makeRegistration({ opportunityId: 'closed-opp', userId: 'user-1' })],
      },
    ]

    const result = aggregateOrganizationVolunteers(items)[0]

    expect(result.registrationCount).toBe(2)
    expect(result.upcomingRegistrationCount).toBe(1)
  })

  it('excludes a past (COMPLETED) opportunity from the upcoming count', () => {
    const pastOpenOpportunity: Opportunity = { ...opp1, date: '2020-01-01', status: 'OPEN' }
    const items = [
      { opportunity: pastOpenOpportunity, registrations: [makeRegistration({})] },
    ]

    expect(aggregateOrganizationVolunteers(items)[0].upcomingRegistrationCount).toBe(0)
  })

  it('falls back to "Volunteer" when volunteerName is missing', () => {
    const items = [{ opportunity: opp1, registrations: [makeRegistration({ volunteerName: null })] }]
    expect(aggregateOrganizationVolunteers(items)[0].name).toBe('Volunteer')
  })

  it('does not merge unrelated people who share a blank userId', () => {
    const items = [
      {
        opportunity: opp1,
        registrations: [
          makeRegistration({
            userId: '',
            volunteerName: 'Person A',
            email: 'a@example.com',
            registeredAt: '2026-06-01T10:00:00',
          }),
          makeRegistration({
            userId: '',
            volunteerName: 'Person B',
            email: 'b@example.com',
            registeredAt: '2026-06-02T10:00:00',
          }),
        ],
      },
    ]

    const result = aggregateOrganizationVolunteers(items)

    expect(result).toHaveLength(2)
    expect(result.map((v) => v.name).sort()).toEqual(['Person A', 'Person B'])
  })

  it('does not display a raw userId anywhere in derived fields', () => {
    const items = [{ opportunity: opp1, registrations: [makeRegistration({ userId: 'user-abc-123' })] }]
    const result = aggregateOrganizationVolunteers(items)[0]

    expect(result.name).not.toContain('user-abc-123')
    expect(result.email).not.toContain('user-abc-123')
  })
})
