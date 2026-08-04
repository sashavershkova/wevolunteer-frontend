import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import OnboardingPage from '../Onboarding/OnboardingPage'
import OpportunitiesListView from '../../components/opportunities/OpportunitiesListView/OpportunitiesListView'
import OpportunityFilters from '../../components/opportunities/OpportunityFilters/OpportunityFilters'
import { getOpportunities, registerForOpportunity } from '../../services/api/opportunityService'
import { getMyRegistrations } from '../../services/api/registrationService'
import { getMyFavorites, removeFavorite, saveFavorite } from '../../services/api/favoriteService'
import { getMyWaitlist, joinWaitlist, leaveWaitlist } from '../../services/api/waitlistService'
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
  const [favoritedOpportunityIds, setFavoritedOpportunityIds] = useState<Set<string>>(
    new Set(),
  )
  const [waitlistedOpportunityIds, setWaitlistedOpportunityIds] = useState<Set<string>>(
    new Set(),
  )

  useEffect(() => {
    if (!auth.accessToken) {
      return
    }

    async function loadOpportunities() {
      try {
        setIsLoading(true)
        setError(null)

        const [allOpportunities, myRegistrations, myFavorites, myWaitlist] = await Promise.all([
          getOpportunities(auth.accessToken),
          getMyRegistrations(auth.accessToken),
          getMyFavorites(auth.accessToken),
          getMyWaitlist(auth.accessToken),
        ])

        const registeredIds = new Set(
          myRegistrations.map((registration) => registration.opportunityId),
        )

        setOpportunities(
          allOpportunities.filter(
            (opportunity) => !registeredIds.has(opportunity.opportunityId),
          ),
        )
        setFavoritedOpportunityIds(
          new Set(myFavorites.map((favorite) => favorite.opportunityId)),
        )
        setWaitlistedOpportunityIds(
          new Set(myWaitlist.map((entry) => entry.opportunityId)),
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

  async function handleToggleFavorite(opportunityId: string) {
    const isCurrentlyFavorited = favoritedOpportunityIds.has(opportunityId)

    if (isCurrentlyFavorited) {
      await removeFavorite(auth.accessToken, opportunityId)
    } else {
      await saveFavorite(auth.accessToken, opportunityId)
    }

    setFavoritedOpportunityIds((previous) => {
      const next = new Set(previous)

      if (isCurrentlyFavorited) {
        next.delete(opportunityId)
      } else {
        next.add(opportunityId)
      }

      return next
    })
  }

  async function handleJoinWaitlist(opportunityId: string) {
    await joinWaitlist(auth.accessToken, opportunityId)

    setWaitlistedOpportunityIds((previous) => new Set(previous).add(opportunityId))
  }

  async function handleLeaveWaitlist(opportunityId: string) {
    await leaveWaitlist(auth.accessToken, opportunityId)

    setWaitlistedOpportunityIds((previous) => {
      const next = new Set(previous)
      next.delete(opportunityId)
      return next
    })
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
        favoritedOpportunityIds={favoritedOpportunityIds}
        onToggleFavorite={handleToggleFavorite}
        waitlistedOpportunityIds={waitlistedOpportunityIds}
        onJoinWaitlist={handleJoinWaitlist}
        onLeaveWaitlist={handleLeaveWaitlist}
      />
    </main>
  )
}

export default OpportunitiesPage