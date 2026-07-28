import { env } from '../../config/env'
import type { Opportunity } from '../../types/Opportunity'

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
