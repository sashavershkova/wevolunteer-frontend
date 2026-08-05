import { useEffect, useMemo, useState } from 'react'
import { useAppAuth } from '../../contexts/AuthContext'
import OpportunitiesListView from '../../components/opportunities/OpportunitiesListView/OpportunitiesListView'
import OpportunityFilters from '../../components/opportunities/OpportunityFilters/OpportunityFilters'
import {
  getOpportunities,
  getOpportunity,
  registerForOpportunity,
} from '../../services/api/opportunityService'
import { cancelMyRegistration, getMyRegistrations } from '../../services/api/registrationService'
import { getMyFavorites, removeFavorite } from '../../services/api/favoriteService'
import { getMyWaitlist, joinWaitlist, leaveWaitlist } from '../../services/api/waitlistService'
import {
  EMPTY_FILTERS,
  filterOpportunities,
  type OpportunityFiltersValue,
} from '../../utils/opportunityFilters'
import type { Opportunity } from '../../types/Opportunity'
import './FavoritesPage.css'

function FavoritesPage() {
  const auth = useAppAuth()

  const [favoritedOpportunities, setFavoritedOpportunities] = useState<Opportunity[]>([])
  const [registeredOpportunityIds, setRegisteredOpportunityIds] = useState<Set<string>>(
    new Set(),
  )
  const [waitlistedOpportunityIds, setWaitlistedOpportunityIds] = useState<Set<string>>(
    new Set(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<OpportunityFiltersValue>(EMPTY_FILTERS)

  useEffect(() => {
    if (!auth.accessToken) {
      return
    }

    async function loadFavorites() {
      try {
        setIsLoading(true)
        setError(null)

        const [allOpportunities, myFavorites, myRegistrations, myWaitlist] = await Promise.all([
          getOpportunities(auth.accessToken),
          getMyFavorites(auth.accessToken),
          getMyRegistrations(auth.accessToken),
          getMyWaitlist(auth.accessToken),
        ])

        const favoritedIds = new Set(
          myFavorites.map((favorite) => favorite.opportunityId),
        )

        setFavoritedOpportunities(
          allOpportunities.filter((opportunity) =>
            favoritedIds.has(opportunity.opportunityId),
          ),
        )
        setRegisteredOpportunityIds(
          new Set(
            myRegistrations.map((registration) => registration.opportunityId),
          ),
        )
        setWaitlistedOpportunityIds(
          new Set(myWaitlist.map((entry) => entry.opportunityId)),
        )
      } catch {
        setError('Unable to load favorites. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadFavorites()
  }, [auth.accessToken])

  const filteredFavorites = useMemo(
    () => filterOpportunities(favoritedOpportunities, filters),
    [favoritedOpportunities, filters],
  )

  const favoritedOpportunityIds = useMemo(
    () => new Set(favoritedOpportunities.map((opportunity) => opportunity.opportunityId)),
    [favoritedOpportunities],
  )

  async function handleRegister(opportunityId: string) {
    await registerForOpportunity(auth.accessToken, auth.userId, opportunityId)

    setFavoritedOpportunities((previous) =>
      previous.map((opportunity) =>
        opportunity.opportunityId === opportunityId
          ? {
              ...opportunity,
              registeredCount: opportunity.registeredCount + 1,
              availableSpots: opportunity.availableSpots - 1,
            }
          : opportunity,
      ),
    )
    setRegisteredOpportunityIds((previous) => new Set(previous).add(opportunityId))
  }

  async function handleCancelRegistration(opportunityId: string) {
    await cancelMyRegistration(auth.accessToken, opportunityId)

    setFavoritedOpportunities((previous) =>
      previous.map((opportunity) =>
        opportunity.opportunityId === opportunityId
          ? {
              ...opportunity,
              registeredCount: opportunity.registeredCount - 1,
              availableSpots: opportunity.availableSpots + 1,
            }
          : opportunity,
      ),
    )
    setRegisteredOpportunityIds((previous) => {
      const next = new Set(previous)
      next.delete(opportunityId)
      return next
    })
  }

  async function handleToggleFavorite(opportunityId: string) {
    await removeFavorite(auth.accessToken, opportunityId)

    setFavoritedOpportunities((previous) =>
      previous.filter((opportunity) => opportunity.opportunityId !== opportunityId),
    )
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

    try {
      const refreshed = await getOpportunity(auth.accessToken, opportunityId)

      if (refreshed) {
        setFavoritedOpportunities((previous) =>
          previous.map((opportunity) =>
            opportunity.opportunityId === opportunityId ? refreshed : opportunity,
          ),
        )
      }
    } catch {
      // Leaving the waitlist already succeeded - a failed refresh just means this
      // card's spot count may be stale until the next full page load.
    }
  }

  return (
    <main className="favorites-page">
      <h1>Favorites</h1>

      <p className="favorites-page-subtitle">Opportunities you&apos;ve saved for later.</p>

      <OpportunityFilters
        opportunities={favoritedOpportunities}
        value={filters}
        onChange={setFilters}
      />

      <OpportunitiesListView
        opportunities={filteredFavorites}
        isLoading={isLoading}
        error={error}
        emptyMessage="You have no saved opportunities yet."
        onRegister={handleRegister}
        favoritedOpportunityIds={favoritedOpportunityIds}
        onToggleFavorite={handleToggleFavorite}
        registeredOpportunityIds={registeredOpportunityIds}
        onCancelRegistration={handleCancelRegistration}
        waitlistedOpportunityIds={waitlistedOpportunityIds}
        onJoinWaitlist={handleJoinWaitlist}
        onLeaveWaitlist={handleLeaveWaitlist}
      />
    </main>
  )
}

export default FavoritesPage
