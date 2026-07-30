import type { Opportunity } from '../types/Opportunity'
import type { Registration } from '../services/api/registrationService'
import { getOpportunityDisplayStatus } from './getOpportunityDisplayStatus'

export type OrganizationVolunteerStatus = 'NEW' | 'RETURNING' | 'FREQUENT'

export type OrganizationVolunteer = {
  userId: string
  name: string
  email: string | null
  registrationCount: number
  opportunityIds: string[]
  firstRegisteredAt: string | null
  mostRecentRegisteredAt: string | null
  upcomingRegistrationCount: number
  status: OrganizationVolunteerStatus
}

export type OrganizationVolunteerSourceItem = {
  opportunity: Opportunity
  registrations: Registration[]
}

type MutableVolunteer = {
  userId: string
  name: string
  email: string | null
  opportunityIds: Set<string>
  upcomingOpportunityIds: Set<string>
  registeredAtValues: { timestamp: number; raw: string }[]
}

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim() === ''
}

function getGroupingKey(registration: Registration): string {
  if (!isBlank(registration.userId)) {
    return `user:${registration.userId}`
  }

  // A blank userId should never happen in practice (the backend always populates it),
  // but if it did, we must not silently merge unrelated people just because their names
  // happen to match. Fall back to a key built from the registration record itself so
  // grouping stays deterministic without inventing a false identity match.
  return `blank-user:${registration.opportunityId}:${registration.registeredAt}:${registration.volunteerName ?? ''}:${registration.email ?? ''}`
}

function getComparableTimestamp(dateString: string): number | null {
  const timestamp = new Date(dateString).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

function deriveStatus(registrationCount: number): OrganizationVolunteerStatus {
  if (registrationCount >= 3) {
    return 'FREQUENT'
  }

  return registrationCount === 2 ? 'RETURNING' : 'NEW'
}

/**
 * Aggregates per-opportunity registrations into one record per volunteer. Pure and
 * React-independent so it can be unit tested directly. Only pass opportunities whose
 * registrations loaded successfully - this function has no concept of loading/error
 * state and assumes every registration given to it is complete data.
 */
export function aggregateOrganizationVolunteers(
  items: OrganizationVolunteerSourceItem[],
): OrganizationVolunteer[] {
  const volunteersByKey = new Map<string, MutableVolunteer>()

  items.forEach(({ opportunity, registrations }) => {
    const isUpcoming = getOpportunityDisplayStatus(opportunity) === 'OPEN'

    registrations.forEach((registration) => {
      const key = getGroupingKey(registration)
      const displayName = registration.volunteerName || 'Volunteer'

      let volunteer = volunteersByKey.get(key)

      if (!volunteer) {
        volunteer = {
          userId: registration.userId,
          name: displayName,
          email: registration.email,
          opportunityIds: new Set(),
          upcomingOpportunityIds: new Set(),
          registeredAtValues: [],
        }
        volunteersByKey.set(key, volunteer)
      }

      volunteer.opportunityIds.add(registration.opportunityId)

      if (isUpcoming) {
        volunteer.upcomingOpportunityIds.add(registration.opportunityId)
      }

      if (volunteer.name === 'Volunteer' && displayName !== 'Volunteer') {
        volunteer.name = displayName
      }

      if (!volunteer.email && registration.email) {
        volunteer.email = registration.email
      }

      const timestamp = getComparableTimestamp(registration.registeredAt)

      if (timestamp !== null) {
        volunteer.registeredAtValues.push({ timestamp, raw: registration.registeredAt })
      }
    })
  })

  return Array.from(volunteersByKey.values()).map((volunteer) => {
    const opportunityIds = Array.from(volunteer.opportunityIds)
    const registrationCount = opportunityIds.length

    let earliestTimestamp: number | null = null
    let latestTimestamp: number | null = null
    let firstRegisteredAt: string | null = null
    let mostRecentRegisteredAt: string | null = null

    volunteer.registeredAtValues.forEach(({ timestamp, raw }) => {
      if (earliestTimestamp === null || timestamp < earliestTimestamp) {
        earliestTimestamp = timestamp
        firstRegisteredAt = raw
      }

      if (latestTimestamp === null || timestamp > latestTimestamp) {
        latestTimestamp = timestamp
        mostRecentRegisteredAt = raw
      }
    })

    return {
      userId: volunteer.userId,
      name: volunteer.name,
      email: volunteer.email,
      registrationCount,
      opportunityIds,
      firstRegisteredAt,
      mostRecentRegisteredAt,
      upcomingRegistrationCount: volunteer.upcomingOpportunityIds.size,
      status: deriveStatus(registrationCount),
    }
  })
}
