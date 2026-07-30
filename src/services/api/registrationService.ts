import { env } from '../../config/env'

export type Registration = {
  userId: string
  opportunityId: string
  title: string
  date: string
  location: string
  organizationId: string
  organizationName: string
  registrationStatus: string
  volunteerName: string | null
  email: string | null
  registeredAt: string
  time?: string | null
  startTime?: string | null
  endTime?: string | null
}

export async function getMyRegistrations(
  accessToken: string,
): Promise<Registration[]> {
  const response = await fetch(`${env.apiUrl}/registrations/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Unable to load registrations: ${response.status}`)
  }

  return response.json() as Promise<Registration[]>
}

export async function getOrganizationOpportunityRegistrations(
  accessToken: string,
  opportunityId: string,
): Promise<Registration[]> {
  const response = await fetch(
    `${env.apiUrl}/organizations/me/opportunities/${encodeURIComponent(opportunityId)}/registrations`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to load registered volunteers: ${response.status}`)
  }

  return response.json() as Promise<Registration[]>
}

export async function cancelMyRegistration(
  accessToken: string,
  opportunityId: string,
): Promise<void> {
  const response = await fetch(
    `${env.apiUrl}/registrations/me/${encodeURIComponent(opportunityId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to cancel registration: ${response.status}`)
  }
}
