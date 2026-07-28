import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Opportunity } from '../../../types/Opportunity'
import { LocationIcon, DateIcon, TimeIcon, SpotsIcon } from '../../shared/icons'
import './OpportunityListItem.css'

type OpportunityListItemProps = {
  opportunity: Opportunity
  onRegister?: (opportunityId: string) => Promise<void>
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

function OpportunityListItem({ opportunity, onRegister }: OpportunityListItemProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  const isFull = opportunity.availableSpots <= 0
  const isClosed = opportunity.status === 'CLOSED'
  const canRegister = !isClosed && !isFull && Boolean(onRegister)
  const spotsStatusClass = isFull
    ? 'opportunity-list-item-spots-full'
    : 'opportunity-list-item-spots-open'

  async function handleRegisterClick() {
    if (!onRegister) {
      return
    }

    setIsRegistering(true)
    setRegisterError(null)

    try {
      await onRegister(opportunity.opportunityId)
      // On success the parent removes this opportunity from the list,
      // so this component will unmount - no further state updates needed.
    } catch (err) {
      setRegisterError(
        err instanceof Error ? err.message : 'Unable to register for this opportunity.',
      )
      setIsRegistering(false)
    }
  }

  return (
    <article className="opportunity-list-item" data-status={opportunity.status}>
      <Link
        to={`/opportunities/${opportunity.opportunityId}`}
        className="opportunity-list-item-stretched-link"
        aria-label={`View details for ${opportunity.title}`}
      />

      <div className="opportunity-list-item-image-placeholder" aria-hidden="true" />

      <div className="opportunity-list-item-content">
        <div className="opportunity-list-item-header">
          <h3 className="opportunity-list-item-title">{opportunity.title}</h3>
          <span className="opportunity-list-item-category">{opportunity.category}</span>
        </div>

        <p className="opportunity-list-item-org">{opportunity.organizationName}</p>

        <p className="opportunity-list-item-description">{opportunity.description}</p>

        <div className="opportunity-list-item-footer-row">
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

          {canRegister && (
            <div className="opportunity-list-item-actions">
              <button
                type="button"
                className="opportunity-list-item-register-button"
                onClick={handleRegisterClick}
                disabled={isRegistering}
              >
                {isRegistering ? 'Registering...' : 'Register'}
              </button>
              {registerError && (
                <p role="alert" className="opportunity-list-item-register-error">
                  {registerError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default OpportunityListItem