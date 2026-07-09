import { env } from '../../config/env'

export const cognitoAuthConfig = {
  authority: env.cognitoAuthority,
  client_id: env.cognitoClientId,
  redirect_uri: env.cognitoRedirectUri,
  response_type: 'code',
  scope: 'email openid phone',
}