import type { Registration } from '../services/api/registrationService'
import { isPastOpportunityDate } from './isPastOpportunityDate'

export type VolunteerRegistrationFiltersValue = {
  search: string
  location: string
  organizationName: string
  startDate: string
  endDate: string
}

export const EMPTY_VOLUNTEER_REGISTRATION_FILTERS: VolunteerRegistrationFiltersValue = {
  search: '',
  location: '',
  organizationName: '',
  startDate: '',
  endDate: '',
}

export function filterVolunteerRegistrations(
  registrations: Registration[],
  filters: VolunteerRegistrationFiltersValue,
): Registration[] {
  return registrations.filter((registration) => {
    if (filters.location && registration.location !== filters.location) {
      return false
    }

    if (
      filters.organizationName &&
      registration.organizationName !== filters.organizationName
    ) {
      return false
    }

    // registration.date and the filter dates are both plain 'YYYY-MM-DD'
    // strings, which sort/compare correctly with plain string comparison -
    // no need to parse into Date objects (and no timezone risk from doing so).
    if (filters.startDate && registration.date < filters.startDate) {
      return false
    }

    if (filters.endDate && registration.date > filters.endDate) {
      return false
    }

    if (filters.search) {
      const term = filters.search.toLowerCase()
      const matchesTitle = registration.title.toLowerCase().includes(term)
      const matchesOrganization = registration.organizationName
        .toLowerCase()
        .includes(term)

      // "Completed" is what the UI actually displays for a past-date
      // registration, but "closed" is treated as a synonym here since
      // that's a common informal way volunteers describe it too.
      const isCompleted = isPastOpportunityDate(registration.date)
      const statusText = isCompleted ? 'completed closed' : 'registered'
      const matchesStatus = statusText.includes(term)

      if (!matchesTitle && !matchesOrganization && !matchesStatus) {
        return false
      }
    }

    return true
  })
}

export function getUniqueSortedVolunteerRegistrationValues(
  registrations: Registration[],
  key: 'location' | 'organizationName',
): string[] {
  const values = new Set(registrations.map((registration) => registration[key]))
  return Array.from(values).sort((a, b) => a.localeCompare(b))
}