import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import OnboardingPage from '../Onboarding/OnboardingPage'
import OpportunitiesListView from '../../components/opportunities/OpportunitiesListView/OpportunitiesListView'
import OpportunityFilters from '../../components/opportunities/OpportunityFilters/OpportunityFilters'
import { getOpportunities, registerForOpportunity } from '../../services/api/opportunityService'
import { getMyRegistrations } from '../../services/api/registrationService'
import {
  EMPTY_FILTERS,
  filterOpportunities,
  type OpportunityFiltersValue,
} from '../../utils/opportunityFilters'
import type { Opportunity } from '../../types/Opportunity'
import './OpportunitiesPage.css'

function OpportunitiesPage() {
  const auth = useAppAuth()

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<OpportunityFiltersValue>(EMPTY_FILTERS)

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

  const filteredOpportunities = useMemo(
    () => filterOpportunities(opportunities, filters),
    [opportunities, filters],
  )

  async function handleRegister(opportunityId: string) {
    await registerForOpportunity(auth.accessToken, auth.userId, opportunityId)

    setOpportunities((previous) =>
      previous.filter((opportunity) => opportunity.opportunityId !== opportunityId),
    )
  }

  if (auth.isProfileLoading) {
    return (
      <main className="opportunities-page">
        <h1>Loading your profile...</h1>
      </main>
    )
  }

  if (auth.profileErrorMessage) {
    return (
      <main className="opportunities-page">
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
    <main className="opportunities-page">
      <h1>Browse Opportunities</h1>

      <p className="opportunities-page-subtitle">
        Finding meaningful ways to make a difference.
      </p>

      <OpportunityFilters
        opportunities={opportunities}
        value={filters}
        onChange={setFilters}
      />

      <OpportunitiesListView
        opportunities={filteredOpportunities}
        isLoading={isLoading}
        error={error}
        onRegister={handleRegister}
      />
    </main>
  )
}

export default OpportunitiesPage