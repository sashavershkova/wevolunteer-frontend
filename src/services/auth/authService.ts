import type { User } from 'oidc-client-ts'

const clientId = '4sebse901tqd7tj4l8jnchpafg'
const logoutUri = 'http://localhost:5173'
const cognitoDomain = 'https://us-east-1dt3p8sftj.auth.us-east-1.amazoncognito.com'

export function getUserEmail(user: User | null | undefined): string {
  return user?.profile.email ?? ''
}

export function getUserId(user: User | null | undefined): string {
  return user?.profile.sub ?? ''
}

export function getAccessToken(user: User | null | undefined): string {
  return user?.access_token ?? ''
}

export function signOutFromCognito(): void {
  const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`
  window.location.assign(logoutUrl)
}