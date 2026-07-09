import { createContext, useContext } from 'react'
import { useAuth } from 'react-oidc-context'
import {
  getUserEmail,
  getUserId,
  getAccessToken,
  signOutFromCognito,
} from '../services/auth/authService'

type AuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  errorMessage: string | null
  email: string
  userId: string
  accessToken: string
  signIn: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  const signIn = () => {
    auth.signinRedirect()
  }

  const signOut = async () => {
    await auth.removeUser()
    signOutFromCognito()
  }

  const value: AuthContextValue = {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    errorMessage: auth.error?.message ?? null,
    email: getUserEmail(auth.user),
    userId: getUserId(auth.user),
    accessToken: getAccessToken(auth.user),
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAppAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAppAuth must be used inside AppAuthProvider')
  }

  return context
}