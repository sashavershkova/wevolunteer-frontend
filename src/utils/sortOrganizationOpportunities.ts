import type { Opportunity } from '../types/Opportunity'
import { getOpportunityDisplayStatus, type OpportunityDisplayStatus } from './getOpportunityDisplayStatus'

const STATUS_GROUP_ORDER: Record<OpportunityDisplayStatus, number> = {
  OPEN: 0,
  COMPLETED: 1,
  CLOSED: 2,
}

function getComparableTimestamp(opportunity: Opportunity): number {
  if (!opportunity.date) {
    return Number.POSITIVE_INFINITY
  }

  const time = opportunity.startTime || '00:00'
  const timestamp = new Date(`${opportunity.date}T${time}`).getTime()

  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
}

/**
 * Returns a new array (the input is never mutated) grouped OPEN, then COMPLETED, then
 * CLOSED (as displayed), each group sorted by date/startTime ascending. Opportunities
 * with unusable dates sort after valid ones within their own status group; ties fall
 * back to title, then original order.
 */
export function sortOrganizationOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return opportunities
    .map((opportunity, index) => ({ opportunity, index }))
    .sort((a, b) => {
      const aGroup = STATUS_GROUP_ORDER[getOpportunityDisplayStatus(a.opportunity)]
      const bGroup = STATUS_GROUP_ORDER[getOpportunityDisplayStatus(b.opportunity)]

      if (aGroup !== bGroup) {
        return aGroup - bGroup
      }

      const aTimestamp = getComparableTimestamp(a.opportunity)
      const bTimestamp = getComparableTimestamp(b.opportunity)

      if (aTimestamp !== bTimestamp) {
        return aTimestamp - bTimestamp
      }

      const titleComparison = a.opportunity.title.localeCompare(b.opportunity.title)

      if (titleComparison !== 0) {
        return titleComparison
      }

      return a.index - b.index
    })
    .map(({ opportunity }) => opportunity)
}
