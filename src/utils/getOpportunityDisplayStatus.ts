import type { Opportunity } from '../types/Opportunity'
import { isPastOpportunityDate } from './isPastOpportunityDate'

export type OpportunityDisplayStatus = 'OPEN' | 'CLOSED' | 'COMPLETED'

/**
 * The status as shown to organizations in the UI. A stored CLOSED status always wins,
 * regardless of date - an organization that closes an opportunity expects it to stay
 * CLOSED even once its date is in the past. Only a non-CLOSED opportunity with a past
 * date reads as COMPLETED. Status casing from the API is normalized defensively since
 * it isn't guaranteed at runtime.
 */
export function getOpportunityDisplayStatus(opportunity: Opportunity): OpportunityDisplayStatus {
  if (String(opportunity.status).toUpperCase() === 'CLOSED') {
    return 'CLOSED'
  }

  return isPastOpportunityDate(opportunity.date) ? 'COMPLETED' : 'OPEN'
}
