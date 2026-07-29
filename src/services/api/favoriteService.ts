import { env } from '../../config/env'

export type Favorite = {
  userId: string
  opportunityId: string
  title: string
  date: string
  location: string
  organizationId: string
  organizationName: string
  favoritedAt: string
}

export async function getMyFavorites(accessToken: string): Promise<Favorite[]> {
  const response = await fetch(`${env.apiUrl}/favorites/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Unable to load favorites: ${response.status}`)
  }

  return response.json() as Promise<Favorite[]>
}

export async function saveFavorite(
  accessToken: string,
  opportunityId: string,
): Promise<Favorite> {
  const response = await fetch(
    `${env.apiUrl}/favorites/me/${encodeURIComponent(opportunityId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to save this opportunity: ${response.status}`)
  }

  return response.json() as Promise<Favorite>
}

export async function removeFavorite(
  accessToken: string,
  opportunityId: string,
): Promise<void> {
  const response = await fetch(
    `${env.apiUrl}/favorites/me/${encodeURIComponent(opportunityId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to remove this favorite: ${response.status}`)
  }
}
