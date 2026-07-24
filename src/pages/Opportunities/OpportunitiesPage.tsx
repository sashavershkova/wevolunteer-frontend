import { useAppAuth } from '../../contexts/AuthContext'
import OnboardingPage from '../Onboarding/OnboardingPage'

function OpportunitiesPage() {
  const auth = useAppAuth()

  if (auth.isProfileLoading) {
    return (
      <main>
        <h1>Loading your profile...</h1>
      </main>
    )
  }

  if (auth.profileErrorMessage) {
    return (
      <main>
        <h1>Unable to load your profile</h1>
        <p>{auth.profileErrorMessage}</p>

        <button type="button" onClick={auth.signOut}>
          Sign out
        </button>
      </main>
    )
  }

  if (auth.userProfile === null) {
    return <OnboardingPage />
  }

  return (
    <main>
      <h1>Opportunities</h1>

      <p>Welcome, {auth.userProfile.name}!</p>
      <p>Role: {auth.userProfile.role}</p>

      <button type="button" onClick={auth.signOut}>
        Sign out
      </button>
    </main>
  )
}

export default OpportunitiesPage