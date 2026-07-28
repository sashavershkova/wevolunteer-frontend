import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import OnboardingPage from '../Onboarding/OnboardingPage'
import OpportunitiesListView from '../../components/opportunities/OpportunitiesListView/OpportunitiesListView'
import { getOpportunities, registerForOpportunity } from '../../services/api/opportunityService'
import { getMyRegistrations } from '../../services/api/registrationService'
import type { Opportunity } from '../../types/Opportunity'

function OpportunitiesPage() {
  const auth = useAppAuth()

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.accessToken) {
      return
    }

    async function loadOpportunities() {
      try {
        setIsLoading(true)
        setError(null)

        const [allOpportunities, myRegistrations] = await Promise.all([
          getOpportunities(auth.accessToken),
          getMyRegistrations(auth.accessToken),
        ])

        const registeredIds = new Set(
          myRegistrations.map((registration) => registration.opportunityId),
        )

        setOpportunities(
          allOpportunities.filter(
            (opportunity) => !registeredIds.has(opportunity.opportunityId),
          ),
        )
      } catch {
        setError('Unable to load opportunities. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadOpportunities()
  }, [auth.accessToken])

  async function handleRegister(opportunityId: string) {
    await registerForOpportunity(auth.accessToken, auth.userId, opportunityId)

    setOpportunities((previous) =>
      previous.filter((opportunity) => opportunity.opportunityId !== opportunityId),
    )
  }

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

      <OpportunitiesListView
        opportunities={opportunities}
        isLoading={isLoading}
        error={error}
        onRegister={handleRegister}
      />
    </main>
  )
}

export default OpportunitiesPage