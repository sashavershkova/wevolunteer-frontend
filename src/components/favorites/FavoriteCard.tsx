import { Link } from 'react-router-dom'
import type { Favorite } from '../../services/api/favoriteService'
import { SaveIcon } from '../shared/icons'
import './FavoriteCard.css'

type FavoriteCardProps = {
  favorite: Favorite
  onRemove: (opportunityId: string) => void
  isRemoving: boolean
}

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function FavoriteCard({ favorite, onRemove, isRemoving }: FavoriteCardProps) {
  return (
    <article className="favorite-card">
      <div className="favorite-card-main">
        <Link to={`/opportunities/${favorite.opportunityId}`} className="favorite-card-title">
          {favorite.title}
        </Link>
        <p className="favorite-card-organization">{favorite.organizationName}</p>

        <dl className="favorite-card-meta">
          <div className="favorite-card-meta-item">
            <dt>Date</dt>
            <dd>{formatDate(favorite.date)}</dd>
          </div>
          <div className="favorite-card-meta-item">
            <dt>Location</dt>
            <dd>{favorite.location}</dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        className="favorite-card-remove-button"
        disabled={isRemoving}
        onClick={() => onRemove(favorite.opportunityId)}
        aria-label={`Remove ${favorite.title} from favorites`}
        aria-pressed="true"
      >
        <SaveIcon aria-hidden="true" fill="currentColor" />
      </button>
    </article>
  )
}

export default FavoriteCard
