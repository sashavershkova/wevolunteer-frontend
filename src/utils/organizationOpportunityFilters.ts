import type { Opportunity } from '../types/Opportunity'
import { getOpportunityDisplayStatus, type OpportunityDisplayStatus } from './getOpportunityDisplayStatus'

export type OrganizationOpportunityStatusFilter = 'ALL' | OpportunityDisplayStatus

export type OrganizationOpportunityFiltersValue = {
  status: OrganizationOpportunityStatusFilter
  category: string
  location: string
  startDate: string
  endDate: string
}

export const EMPTY_ORGANIZATION_OPPORTUNITY_FILTERS: OrganizationOpportunityFiltersValue = {
  status: 'ALL',
  category: '',
  location: '',
  startDate: '',
  endDate: '',
}

export function filterOrganizationOpportunities(
  opportunities: Opportunity[],
  filters: OrganizationOpportunityFiltersValue,
): Opportunity[] {
  return opportunities.filter((opportunity) => {
    if (
      filters.status !== 'ALL' &&
      getOpportunityDisplayStatus(opportunity) !== filters.status
    ) {
      return false
    }

    if (filters.category && opportunity.category !== filters.category) {
      return false
    }

    if (filters.location && opportunity.location !== filters.location) {
      return false
    }

    // opportunity.date and the filter dates are both plain 'YYYY-MM-DD' strings,
    // which compare correctly as strings - no Date parsing needed (see opportunityFilters.ts).
    if (filters.startDate && opportunity.date < filters.startDate) {
      return false
    }

    if (filters.endDate && opportunity.date > filters.endDate) {
      return false
    }

    return true
  })
}
