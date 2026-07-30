import type { Opportunity } from '../types/Opportunity'

export type OpportunityFiltersValue = {
  search: string
  category: string
  location: string
  organizationName: string
  startDate: string
  endDate: string
}

export const EMPTY_FILTERS: OpportunityFiltersValue = {
  search: '',
  category: '',
  location: '',
  organizationName: '',
  startDate: '',
  endDate: '',
}

export function filterOpportunities(
  opportunities: Opportunity[],
  filters: OpportunityFiltersValue,
): Opportunity[] {
  return opportunities.filter((opportunity) => {
    if (filters.category && opportunity.category !== filters.category) {
      return false
    }

    if (filters.location && opportunity.location !== filters.location) {
      return false
    }

    if (
      filters.organizationName &&
      opportunity.organizationName !== filters.organizationName
    ) {
      return false
    }

    // opportunity.date and the filter dates are both plain 'YYYY-MM-DD'
    // strings, which sort/compare correctly with plain string comparison -
    // no need to parse into Date objects (and no timezone risk from doing so).
    if (filters.startDate && opportunity.date < filters.startDate) {
      return false
    }

    if (filters.endDate && opportunity.date > filters.endDate) {
      return false
    }

    if (filters.search) {
      const term = filters.search.toLowerCase()
      const matchesTitle = opportunity.title.toLowerCase().includes(term)
      const matchesDescription = opportunity.description
        .toLowerCase()
        .includes(term)

      if (!matchesTitle && !matchesDescription) {
        return false
      }
    }

    return true
  })
}

export function getUniqueSortedValues(
  opportunities: Opportunity[],
  key: 'category' | 'location' | 'organizationName',
): string[] {
  const values = new Set(opportunities.map((opportunity) => opportunity[key]))
  return Array.from(values).sort((a, b) => a.localeCompare(b))
}