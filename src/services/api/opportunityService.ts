import { env } from '../../config/env'
import type { Opportunity, OpportunityStatus } from '../../types/Opportunity'

export type CreateOpportunityRequest = {
  opportunityId: string
  title: string
  description: string
  category: string
  location: string
  date: string
  capacity: number
  startTime: string
  endTime: string
}

export type UpdateOpportunityRequest = {
  title: string
  description: string
  category: string
  location: string
  date: string
  status: OpportunityStatus
  capacity: number
  startTime: string
  endTime: string
  whatYoullDo: string[]
  recurring: boolean
}

export async function getOpportunities(accessToken: string): Promise<Opportunity[]> {
  const response = await fetch(`${env.apiUrl}/opportunities`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Unable to load opportunities: ${response.status}`)
  }

  return response.json() as Promise<Opportunity[]>
}

export async function getOpportunity(
  accessToken: string,
  opportunityId: string,
): Promise<Opportunity | null> {
  const response = await fetch(
    `${env.apiUrl}/opportunities/${encodeURIComponent(opportunityId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Unable to load opportunity: ${response.status}`)
  }

  return response.json() as Promise<Opportunity>
}

export async function registerForOpportunity(
  accessToken: string,
  userId: string,
  opportunityId: string,
): Promise<void> {
  const response = await fetch(`${env.apiUrl}/registrations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, opportunityId }),
  })

  if (!response.ok) {
    throw new Error(`Unable to register for this opportunity: ${response.status}`)
  }
}

export async function closeOpportunity(
  accessToken: string,
  opportunityId: string,
): Promise<Opportunity> {
  const response = await fetch(
    `${env.apiUrl}/opportunities/${encodeURIComponent(opportunityId)}/close`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to close this opportunity: ${response.status}`)
  }

  return response.json() as Promise<Opportunity>
}

export async function reopenOpportunity(
  accessToken: string,
  opportunityId: string,
): Promise<Opportunity> {
  const response = await fetch(
    `${env.apiUrl}/opportunities/${encodeURIComponent(opportunityId)}/reopen`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to reopen this opportunity: ${response.status}`)
  }

  return response.json() as Promise<Opportunity>
}

export async function deleteOpportunity(
  accessToken: string,
  opportunityId: string,
): Promise<void> {
  const response = await fetch(
    `${env.apiUrl}/organizations/me/opportunities/${encodeURIComponent(opportunityId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to delete this opportunity: ${response.status}`)
  }
}

export async function updateOpportunity(
  accessToken: string,
  opportunityId: string,
  request: UpdateOpportunityRequest,
): Promise<Opportunity> {
  const response = await fetch(
    `${env.apiUrl}/opportunities/${encodeURIComponent(opportunityId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to update this opportunity: ${response.status}`)
  }

  return response.json() as Promise<Opportunity>
}

export async function createOpportunity(
  accessToken: string,
  request: CreateOpportunityRequest,
): Promise<Opportunity> {
  const response = await fetch(`${env.apiUrl}/organizations/me/opportunities`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Unable to create this opportunity: ${response.status}`)
  }

  return response.json() as Promise<Opportunity>
}
