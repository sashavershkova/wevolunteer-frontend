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
  time: string | null
  startTime: string | null
  endTime: string | null
  whatYoullDo: string[]
  recurring: boolean
}