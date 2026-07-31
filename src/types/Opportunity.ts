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
  /**
   * Temporary pre-signed link to the opportunity image, regenerated on every
   * response, or null when no image has been uploaded. The durable S3 key stays
   * on the server and is deliberately never sent to the browser.
   */
  imageUrl: string | null
}