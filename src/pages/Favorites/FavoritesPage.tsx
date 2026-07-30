import { useEffect, useState } from 'react'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyFavorites, removeFavorite, type Favorite } from '../../services/api/favoriteService'
import FavoriteCard from '../../components/favorites/FavoriteCard'
import './FavoritesPage.css'

function FavoritesPage() {
  const auth = useAppAuth()

  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(auth.accessToken))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [removingOpportunityId, setRemovingOpportunityId] = useState<string | null>(null)
  const [removalErrorMessage, setRemovalErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.accessToken) {
      return
    }

    let ignore = false

    const loadFavorites = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const result = await getMyFavorites(auth.accessToken)

        if (!ignore) {
          setFavorites(result)
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load favorites',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadFavorites()

    return () => {
      ignore = true
    }
  }, [auth.accessToken])

  const handleRemoveFavorite = async (opportunityId: string) => {
    if (!auth.accessToken) {
      return
    }

    setRemovalErrorMessage(null)
    setRemovingOpportunityId(opportunityId)

    try {
      await removeFavorite(auth.accessToken, opportunityId)

      setFavorites((current) =>
        current.filter((favorite) => favorite.opportunityId !== opportunityId),
      )
    } catch (error) {
      setRemovalErrorMessage(
        error instanceof Error ? error.message : 'Unable to remove favorite',
      )
    } finally {
      setRemovingOpportunityId(null)
    }
  }

  if (isLoading) {
    return (
      <main className="favorites-page">
        <h1>Favorites</h1>
        <p>Loading favorites...</p>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="favorites-page">
        <h1>Favorites</h1>
        <p>{errorMessage}</p>
      </main>
    )
  }

  if (favorites.length === 0) {
    return (
      <main className="favorites-page">
        <h1>Favorites</h1>
        <p>You have no saved opportunities yet.</p>
      </main>
    )
  }

  const sortedFavorites = [...favorites].sort((a, b) =>
    b.favoritedAt.localeCompare(a.favoritedAt),
  )

  return (
    <main className="favorites-page">
      <h1>Favorites</h1>
      <p className="favorites-subtitle">Opportunities you&apos;ve saved for later.</p>

      {removalErrorMessage && (
        <p role="alert" className="favorites-error">
          {removalErrorMessage}
        </p>
      )}

      <ul className="favorites-list">
        {sortedFavorites.map((favorite) => (
          <li key={favorite.opportunityId}>
            <FavoriteCard
              favorite={favorite}
              onRemove={handleRemoveFavorite}
              isRemoving={removingOpportunityId === favorite.opportunityId}
            />
          </li>
        ))}
      </ul>
    </main>
  )
}

export default FavoritesPage
