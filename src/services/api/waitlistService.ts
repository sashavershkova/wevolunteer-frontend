import { env } from '../../config/env'

export type Waitlist = {
  userId: string
  opportunityId: string
  title: string
  date: string
  location: string
  organizationId: string
  organizationName: string
  volunteerName: string
  email: string
  joinedAt: string
}

export async function getMyWaitlist(accessToken: string): Promise<Waitlist[]> {
  const response = await fetch(`${env.apiUrl}/waitlist/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Unable to load your waitlist: ${response.status}`)
  }

  return response.json() as Promise<Waitlist[]>
}

export async function joinWaitlist(
  accessToken: string,
  opportunityId: string,
): Promise<Waitlist> {
  const response = await fetch(
    `${env.apiUrl}/waitlist/me/${encodeURIComponent(opportunityId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to join the waitlist: ${response.status}`)
  }

  return response.json() as Promise<Waitlist>
}

export async function leaveWaitlist(
  accessToken: string,
  opportunityId: string,
): Promise<void> {
  const response = await fetch(
    `${env.apiUrl}/waitlist/me/${encodeURIComponent(opportunityId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to leave the waitlist: ${response.status}`)
  }
}

export async function getOrganizationOpportunityWaitlist(
  accessToken: string,
  opportunityId: string,
): Promise<Waitlist[]> {
  const response = await fetch(
    `${env.apiUrl}/organizations/me/opportunities/${encodeURIComponent(opportunityId)}/waitlist`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!response.ok) {
    throw new Error(`Unable to load the waiting list: ${response.status}`)
  }

  return response.json() as Promise<Waitlist[]>
}
