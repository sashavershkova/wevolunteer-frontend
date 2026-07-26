import { env } from '../../config/env'

export type OrganizationProfile = {
  organizationId: string
  name: string
  description: string
  email: string
  website: string
}

export type CreateOrganizationProfileRequest = {
  name: string
  description: string
  email: string
  website: string
}

export async function createOrganization(
  accessToken: string,
  request: CreateOrganizationProfileRequest,
): Promise<OrganizationProfile> {
  const response = await fetch(`${env.apiUrl}/organizations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Unable to create organization profile: ${response.status}`)
  }

  return response.json() as Promise<OrganizationProfile>
}

export async function getCurrentOrganization(
  accessToken: string,
): Promise<OrganizationProfile | null> {
  const response = await fetch(`${env.apiUrl}/organizations/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load organization profile: ${response.status}`,
    )
  }

  return response.json() as Promise<OrganizationProfile>
}