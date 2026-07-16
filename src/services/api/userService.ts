import { env } from '../../config/env'

export type UserProfile = {
  userId: string
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