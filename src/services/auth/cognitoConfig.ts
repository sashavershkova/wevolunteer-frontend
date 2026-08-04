import { env } from '../../config/env'

export const cognitoAuthConfig = {
  authority: env.cognitoAuthority,
  client_id: env.cognitoClientId,
  redirect_uri: env.cognitoRedirectUri,
  response_type: 'code',
  scope: 'email openid phone',
  // Without this, the ?code=...&state=... query params stay in the URL after a
  // successful sign-in. React StrictMode's double-effect-invocation (dev mode only)
  // then reprocesses the same leftover code/state a second time, but the state was
  // already consumed by the first pass - producing "No matching state found in
  // storage". Stripping the query string immediately after processing prevents the
  // reprocessing entirely.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname)
  },
}