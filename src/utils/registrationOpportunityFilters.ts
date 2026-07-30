import type { Opportunity } from '../types/Opportunity'
import type { Registration } from '../services/api/registrationService'
import { getOpportunityDisplayStatus, type OpportunityDisplayStatus } from './getOpportunityDisplayStatus'

export type RegistrationFilterStatus = 'ALL' | OpportunityDisplayStatus
export type RegistrationFilterState = 'ALL' | 'WITH_REGISTRATIONS' | 'NO_REGISTRATIONS'

export type RegistrationOpportunityFiltersValue = {
  search: string
  status: RegistrationFilterStatus
  registrationState: RegistrationFilterState
  startDate: string
  endDate: string
}

export const EMPTY_REGISTRATION_OPPORTUNITY_FILTERS: RegistrationOpportunityFiltersValue = {
  search: '',
  status: 'ALL',
  registrationState: 'ALL',
  startDate: '',
  endDate: '',
}

export type RegistrationOpportunityItem = {
  opportunity: Opportunity
  registrations: Registration[]
  isLoading: boolean
  error: string | null
}

export function filterRegistrationOpportunities(
  items: RegistrationOpportunityItem[],
  filters: RegistrationOpportunityFiltersValue,
): RegistrationOpportunityItem[] {
  return items.filter(({ opportunity, registrations, isLoading, error }) => {
    if (
      filters.status !== 'ALL' &&
      getOpportunityDisplayStatus(opportunity) !== filters.status
    ) {
      return false
    }

    // opportunity.date and the filter dates are both plain 'YYYY-MM-DD' strings,
    // which compare correctly as strings - same semantics as My Opportunities.
    if (filters.startDate && opportunity.date < filters.startDate) {
      return false
    }

    if (filters.endDate && opportunity.date > filters.endDate) {
      return false
    }

    if (filters.registrationState !== 'ALL') {
      // A still-loading or errored opportunity can't be safely classified as having
      // registrations or not, so it's excluded from either registration-state filter
      // rather than being guessed at.
      if (isLoading || error) {
        return false
      }

      const hasRegistrations = registrations.length > 0

      if (filters.registrationState === 'WITH_REGISTRATIONS' && !hasRegistrations) {
        return false
      }

      if (filters.registrationState === 'NO_REGISTRATIONS' && hasRegistrations) {
        return false
      }
    }

    if (filters.search) {
      const term = filters.search.toLowerCase()
      const matchesTitle = opportunity.title.toLowerCase().includes(term)
      const matchesLocation = opportunity.location.toLowerCase().includes(term)
      const matchesVolunteer = registrations.some((registration) => {
        const name = (registration.volunteerName ?? '').toLowerCase()
        const email = (registration.email ?? '').toLowerCase()
        return name.includes(term) || email.includes(term)
      })

      if (!matchesTitle && !matchesLocation && !matchesVolunteer) {
        return false
      }
    }

    return true
  })
}
