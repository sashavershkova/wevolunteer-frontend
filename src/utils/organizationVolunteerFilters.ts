import type { OrganizationVolunteer, OrganizationVolunteerStatus } from './aggregateOrganizationVolunteers'

export type VolunteerStatusFilter = 'ALL' | OrganizationVolunteerStatus
export type VolunteerActivityFilter = 'ALL' | 'HAS_UPCOMING' | 'HISTORY_ONLY'
export type VolunteerSort = 'MOST_REGISTRATIONS' | 'MOST_RECENT' | 'NAME_ASC'

export type OrganizationVolunteerFiltersValue = {
  search: string
  status: VolunteerStatusFilter
  activity: VolunteerActivityFilter
  sort: VolunteerSort
}

export const EMPTY_ORGANIZATION_VOLUNTEER_FILTERS: OrganizationVolunteerFiltersValue = {
  search: '',
  status: 'ALL',
  activity: 'ALL',
  sort: 'MOST_REGISTRATIONS',
}

function getComparableTimestamp(dateString: string | null): number {
  if (!dateString) {
    return Number.NEGATIVE_INFINITY
  }

  const timestamp = new Date(dateString).getTime()
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp
}

export function filterOrganizationVolunteers(
  volunteers: OrganizationVolunteer[],
  filters: OrganizationVolunteerFiltersValue,
): OrganizationVolunteer[] {
  return volunteers.filter((volunteer) => {
    if (filters.status !== 'ALL' && volunteer.status !== filters.status) {
      return false
    }

    if (filters.activity === 'HAS_UPCOMING' && volunteer.upcomingRegistrationCount === 0) {
      return false
    }

    if (filters.activity === 'HISTORY_ONLY' && volunteer.upcomingRegistrationCount > 0) {
      return false
    }

    if (filters.search) {
      const term = filters.search.toLowerCase()
      const matchesName = volunteer.name.toLowerCase().includes(term)
      const matchesEmail = (volunteer.email ?? '').toLowerCase().includes(term)

      if (!matchesName && !matchesEmail) {
        return false
      }
    }

    return true
  })
}

/**
 * Every sort mode shares the same tie-breakers - most recent registration, then name
 * alphabetically, then original order - so results stay deterministic instead of
 * re-shuffling on every render.
 */
export function sortOrganizationVolunteers(
  volunteers: OrganizationVolunteer[],
  sort: VolunteerSort,
): OrganizationVolunteer[] {
  return volunteers
    .map((volunteer, index) => ({ volunteer, index }))
    .sort((a, b) => {
      if (sort === 'NAME_ASC') {
        const nameComparison = a.volunteer.name.localeCompare(b.volunteer.name)
        if (nameComparison !== 0) {
          return nameComparison
        }
        return a.index - b.index
      }

      if (sort === 'MOST_REGISTRATIONS' && a.volunteer.registrationCount !== b.volunteer.registrationCount) {
        return b.volunteer.registrationCount - a.volunteer.registrationCount
      }

      const aTimestamp = getComparableTimestamp(a.volunteer.mostRecentRegisteredAt)
      const bTimestamp = getComparableTimestamp(b.volunteer.mostRecentRegisteredAt)

      if (aTimestamp !== bTimestamp) {
        return bTimestamp - aTimestamp
      }

      const nameComparison = a.volunteer.name.localeCompare(b.volunteer.name)
      if (nameComparison !== 0) {
        return nameComparison
      }

      return a.index - b.index
    })
    .map(({ volunteer }) => volunteer)
}

export function filterAndSortOrganizationVolunteers(
  volunteers: OrganizationVolunteer[],
  filters: OrganizationVolunteerFiltersValue,
): OrganizationVolunteer[] {
  return sortOrganizationVolunteers(filterOrganizationVolunteers(volunteers, filters), filters.sort)
}
