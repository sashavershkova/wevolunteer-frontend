import { env } from '../../config/env'

export type UserProfile = {
  userId: string
  name: string
  email: string
  role: 'VOLUNTEER' | 'ORGANIZATION'
  /** Temporary pre-signed link, or null when no photo has been uploaded. */
  profileImageUrl: string | null
}

export type CreateUserProfileRequest = {
  name: string
  email: string
  role: 'VOLUNTEER' | 'ORGANIZATION'
}

export type UpdateUserProfileRequest = {
  name: string
  email: string
  /**
   * Required by the backend request shape, but the backend always ignores
   * whatever value is sent here and preserves the user's existing role - a
   * self-service profile edit can never change VOLUNTEER/ORGANIZATION role.
   * Always send the user's current, unchanged role here.
   */
  role: 'VOLUNTEER' | 'ORGANIZATION'
}

export async function getCurrentUser(
  accessToken: string,
): Promise<UserProfile | null> {
  const response = await fetch(`${env.apiUrl}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Unable to load user profile: ${response.status}`)
  }

  return response.json() as Promise<UserProfile>
}

export async function createCurrentUser(
  accessToken: string,
  request: CreateUserProfileRequest,
): Promise<UserProfile> {
  const response = await fetch(`${env.apiUrl}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Unable to create user profile: ${response.status}`)
  }

  return response.json() as Promise<UserProfile>
}

export async function updateCurrentUser(
  accessToken: string,
  request: UpdateUserProfileRequest,
): Promise<UserProfile> {
  const response = await fetch(`${env.apiUrl}/users/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Unable to update user profile: ${response.status}`)
  }

  return response.json() as Promise<UserProfile>
}