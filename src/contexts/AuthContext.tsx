import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import {
  getUserEmail,
  getUserId,
  getAccessToken,
  signUpWithCognito,
  signOutFromCognito,
} from '../services/auth/authService'
import {
  getCurrentUser,
  type UserProfile,
} from '../services/api/userService'

type AuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  errorMessage: string | null
  email: string
  userId: string
  accessToken: string
  userProfile: UserProfile | null
  isProfileLoading: boolean
  profileErrorMessage: string | null
  updateUserProfile: (profile: UserProfile | null) => void
  signIn: () => void
  signOut: () => Promise<void>
  signUp: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const accessToken = getAccessToken(auth.user)

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(
    null,
  )

  useEffect(() => {
    let ignore = false

    if (!auth.isAuthenticated || !accessToken) {
      setUserProfile(null)
      setIsProfileLoading(false)
      setProfileErrorMessage(null)
      return
    }

    const loadUserProfile = async () => {
      setIsProfileLoading(true)
      setProfileErrorMessage(null)

      try {
        const profile = await getCurrentUser(accessToken)

        if (!ignore) {
          setUserProfile(profile)
        }
      } catch (error) {
        if (ignore) {
          return
        }

        setUserProfile(null)

        if (error instanceof Error) {
          setProfileErrorMessage(error.message)
        } else {
          setProfileErrorMessage('Unable to load user profile')
        }
      } finally {
        if (!ignore) {
          setIsProfileLoading(false)
        }
      }
    }

    void loadUserProfile()

    return () => {
      ignore = true
    }
  }, [auth.isAuthenticated, accessToken])

  const updateUserProfile = (profile: UserProfile | null) => {
    setUserProfile(profile)
    setProfileErrorMessage(null)
  }

  const signIn = () => {
    auth.signinRedirect()
  }

  const signOut = async () => {
    await auth.removeUser()
    signOutFromCognito()
  }

  const signUp = () => {
    signUpWithCognito()
  }

  const value: AuthContextValue = {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    errorMessage: auth.error?.message ?? null,
    email: getUserEmail(auth.user),
    userId: getUserId(auth.user),
    accessToken,
    userProfile,
    isProfileLoading,
    profileErrorMessage,
    updateUserProfile,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAppAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAppAuth must be used inside AuthProvider')
  }

  return context
}