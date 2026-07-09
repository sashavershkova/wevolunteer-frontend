import type { User } from 'oidc-client-ts'
import { env } from '../../config/env'

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
  const logoutUrl = `${env.cognitoDomain}/logout?client_id=${env.cognitoClientId}&logout_uri=${encodeURIComponent(env.cognitoLogoutUri)}`
  window.location.assign(logoutUrl)
}