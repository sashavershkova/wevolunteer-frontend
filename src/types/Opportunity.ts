export type OpportunityStatus = 'OPEN' | 'CLOSED'

export type Opportunity = {
  opportunityId: string
  title: string
  description: string
  category: string
  location: string
  date: string
  status: OpportunityStatus
  organizationId: string
  organizationName: string
  capacity: number
  registeredCount: number
  availableSpots: number
}