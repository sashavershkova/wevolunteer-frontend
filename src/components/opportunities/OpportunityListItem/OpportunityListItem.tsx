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

function OpportunityListItem({ opportunity }: OpportunityListItemProps) {
  const isFull = opportunity.availableSpots <= 0
  const isClosed = opportunity.status === 'CLOSED'

  return (
    <article className="opportunity-list-item" data-status={opportunity.status}>
      <div className="opportunity-list-item-image-placeholder" aria-hidden="true" />

      <div className="opportunity-list-item-content">
        <div className="opportunity-list-item-header">
          <h3 className="opportunity-list-item-title">{opportunity.title}</h3>
          <span className="opportunity-list-item-category">{opportunity.category}</span>
        </div>

        <p className="opportunity-list-item-org">{opportunity.organizationName}</p>

        <dl className="opportunity-list-item-details">
          <div>
            <dt>Date</dt>
            <dd>{formatDate(opportunity.date)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{opportunity.location}</dd>
          </div>
        </dl>

        <p className="opportunity-list-item-description">{opportunity.description}</p>

        <div className="opportunity-list-item-footer">
          {isClosed ? (
            <span className="opportunity-list-item-status opportunity-list-item-status-closed">
              Closed
            </span>
          ) : isFull ? (
            <span className="opportunity-list-item-status opportunity-list-item-status-full">
              Full
            </span>
          ) : (
            <span className="opportunity-list-item-status opportunity-list-item-status-open">
              {opportunity.availableSpots} of {opportunity.capacity} spots open
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export default OpportunityListItem