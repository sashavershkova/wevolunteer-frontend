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
import {
  getCurrentOrganization,
  type OrganizationProfile,
} from '../services/api/organizationService'

type AuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  errorMessage: string | null
  email: string
  userId: string
  accessToken: string
  userProfile: UserProfile | null
  organizationProfile: OrganizationProfile | null
  isProfileLoading: boolean
  isProfileInitialized: boolean
  profileErrorMessage: string | null
  updateUserProfile: (profile: UserProfile | null) => void
  updateOrganizationProfile: (
    profile: OrganizationProfile | null,
  ) => void
  signIn: () => void
  signOut: () => Promise<void>
  signUp: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const accessToken = getAccessToken(auth.user)

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [organizationProfile, setOrganizationProfile] =
    useState<OrganizationProfile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(
    null,
  )

  // The auth identity (access token, or null when unauthenticated) that userProfile/
  // organizationProfile above actually reflect. currentAuthKey below is derived fresh
  // from auth.isAuthenticated/accessToken on every render, so comparing it against
  // this state gives an isProfileInitialized value with no one-render lag -- unlike
  // deriving it from isProfileLoading, which only updates a render *after*
  // auth.isAuthenticated flips, once the effect below has had a chance to run.
  // Without that, a page could see a still-null profile before the profile fetch had
  // even started and treat "no profile" as final, redirecting away.
  const [resolvedProfileAuthKey, setResolvedProfileAuthKey] = useState<
    string | null | undefined
  >(undefined)

  const currentAuthKey = auth.isAuthenticated && accessToken ? accessToken : null
  const isProfileInitialized = resolvedProfileAuthKey === currentAuthKey

  useEffect(() => {
    let ignore = false

    const resolveProfile = async () => {
      if (!auth.isAuthenticated || !accessToken) {
        setUserProfile(null)
        setOrganizationProfile(null)
        setIsProfileLoading(false)
        setProfileErrorMessage(null)
        setResolvedProfileAuthKey(null)
        return
      }

      setIsProfileLoading(true)
      setProfileErrorMessage(null)

      try {
        const currentUser = await getCurrentUser(accessToken)

        if (ignore) {
          return
        }

        if (currentUser) {
          setUserProfile(currentUser)
          setOrganizationProfile(null)
          return
        }

        const currentOrganization =
          await getCurrentOrganization(accessToken)

        if (!ignore) {
          setUserProfile(null)
          setOrganizationProfile(currentOrganization)
        }
      } catch (error) {
        if (ignore) {
          return
        }

        setUserProfile(null)
        setOrganizationProfile(null)

        if (error instanceof Error) {
          setProfileErrorMessage(error.message)
        } else {
          setProfileErrorMessage('Unable to load account profile')
        }
      } finally {
        if (!ignore) {
          setIsProfileLoading(false)
          setResolvedProfileAuthKey(accessToken)
        }
      }
    }

    void resolveProfile()

    return () => {
      ignore = true
    }
  }, [auth.isAuthenticated, accessToken])

  const updateUserProfile = (profile: UserProfile | null) => {
    setUserProfile(profile)
    setOrganizationProfile(null)
    setProfileErrorMessage(null)
  }

  const updateOrganizationProfile = (
    profile: OrganizationProfile | null,
  ) => {
    setOrganizationProfile(profile)
    setUserProfile(null)
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
    organizationProfile,
    isProfileLoading,
    isProfileInitialized,
    profileErrorMessage,
    updateUserProfile,
    updateOrganizationProfile,
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