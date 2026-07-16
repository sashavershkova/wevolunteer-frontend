import { env } from '../../config/env'

export type UserProfile = {
  userId: string
  name: string
  email: string
  role: 'VOLUNTEER' | 'ORGANIZATION'
}

export type CreateUserProfileRequest = {
  name: string
  email: string
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