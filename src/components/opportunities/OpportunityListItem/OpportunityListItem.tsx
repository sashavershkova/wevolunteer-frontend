import { Link } from 'react-router-dom'
import { LocationIcon, DateIcon, TimeIcon, SpotsIcon } from '../../shared/icons'
import type { Opportunity } from '../../../types/Opportunity'
import './OpportunityListItem.css'

type OpportunityListItemProps = {
  opportunity: Opportunity
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

// Placeholder only: the backend's `date` field has no time component yet
// (see Opportunity type / backend model). Remove this once a real
// start/end time is available from the API.
const PLACEHOLDER_TIME = '9:00 AM - 1:00 PM'

function OpportunityListItem({ opportunity }: OpportunityListItemProps) {
  const isFull = opportunity.availableSpots <= 0
  const isClosed = opportunity.status === 'CLOSED'
  const spotsStatusClass = isFull
    ? 'opportunity-list-item-spots-full'
    : 'opportunity-list-item-spots-open'

  return (
    <Link
      to={`/opportunities/${opportunity.opportunityId}`}
      className="opportunity-list-item-link"
    >
      <article className="opportunity-list-item" data-status={opportunity.status}>
        <div className="opportunity-list-item-image-placeholder" aria-hidden="true" />

        <div className="opportunity-list-item-content">
          <div className="opportunity-list-item-header">
            <h3 className="opportunity-list-item-title">{opportunity.title}</h3>
            <span className="opportunity-list-item-category">{opportunity.category}</span>
          </div>

          <p className="opportunity-list-item-org">{opportunity.organizationName}</p>

          <p className="opportunity-list-item-description">{opportunity.description}</p>

          <ul className="opportunity-list-item-meta">
            <li>
              <LocationIcon className="opportunity-list-item-meta-icon" aria-hidden="true" />
              {opportunity.location}
            </li>
            <li>
              <DateIcon className="opportunity-list-item-meta-icon" aria-hidden="true" />
              {formatDate(opportunity.date)}
            </li>
            <li>
              <TimeIcon className="opportunity-list-item-meta-icon" aria-hidden="true" />
              {PLACEHOLDER_TIME}
            </li>
            <li className={spotsStatusClass}>
              <SpotsIcon className="opportunity-list-item-meta-icon" aria-hidden="true" />
              {isClosed
                ? 'Closed'
                : `${opportunity.registeredCount}/${opportunity.capacity} spots filled`}
            </li>
          </ul>
        </div>
      </article>
    </Link>
  )
}

export default OpportunityListItem