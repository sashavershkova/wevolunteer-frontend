import { useEffect, useMemo, useState } from 'react'
import { useAppAuth } from '../../contexts/AuthContext'
import OpportunitiesListView from '../../components/opportunities/OpportunitiesListView/OpportunitiesListView'
import OpportunityFilters from '../../components/opportunities/OpportunityFilters/OpportunityFilters'
import { getOpportunities, registerForOpportunity } from '../../services/api/opportunityService'
import { getMyFavorites, removeFavorite } from '../../services/api/favoriteService'
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

        const [allOpportunities, myFavorites] = await Promise.all([
          getOpportunities(auth.accessToken),
          getMyFavorites(auth.accessToken),
        ])

        const favoritedIds = new Set(
          myFavorites.map((favorite) => favorite.opportunityId),
        )

        setFavoritedOpportunities(
          allOpportunities.filter((opportunity) =>
            favoritedIds.has(opportunity.opportunityId),
          ),
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
  }

  async function handleToggleFavorite(opportunityId: string) {
    await removeFavorite(auth.accessToken, opportunityId)

    setFavoritedOpportunities((previous) =>
      previous.filter((opportunity) => opportunity.opportunityId !== opportunityId),
    )
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
      />
    </main>
  )
}

export default FavoritesPage
