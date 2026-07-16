import { useEffect, useState } from 'react'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getCurrentUser,
  type UserProfile,
} from '../../services/api/userService'
import OnboardingPage from '../Onboarding/OnboardingPage'

function OpportunitiesPage() {
  const auth = useAppAuth()

  const [profile, setProfile] = useState<
    UserProfile | null | undefined
  >(undefined)

  useEffect(() => {
    async function loadProfile() {
      if (!auth.accessToken) {
        return
      }

      const user = await getCurrentUser(auth.accessToken)
      setProfile(user)
    }

    void loadProfile()
  }, [auth.accessToken])

  if (profile === undefined) {
    return (
      <main>
        <h1>Loading your profile...</h1>
      </main>
    )
  }

  if (profile === null) {
    return <OnboardingPage onProfileCreated={setProfile} />
  }

  return (
    <main>
      <h1>Opportunities</h1>

      <p>Welcome, {profile.name}!</p>
      <p>Role: {profile.role}</p>

      <button type="button" onClick={auth.signOut}>
        Sign out
      </button>
    </main>
  )
}

export default OpportunitiesPage