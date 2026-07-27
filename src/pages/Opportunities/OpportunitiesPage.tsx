import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import OnboardingPage from '../Onboarding/OnboardingPage'
import OpportunitiesListView from '../../components/opportunities/OpportunitiesListView/OpportunitiesListView'
import { mockOpportunities } from '../../tests/fixtures/opportunities'

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

  if (auth.organizationProfile !== null) {
    return <Navigate to="/organization" replace />
  }

  if (auth.userProfile === null) {
    return <OnboardingPage />
  }

  return (
    <main>
      <h1>Opportunities</h1>

      <p>Welcome, {auth.userProfile.name}!</p>

      {/* Temporary: using fixture data until opportunityService is wired up tomorrow */}
      <OpportunitiesListView opportunities={mockOpportunities} />

      <button type="button" onClick={auth.signOut}>
        Sign out
      </button>
    </main>
  )
}

export default OpportunitiesPage