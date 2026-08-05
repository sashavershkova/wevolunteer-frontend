import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Opportunity } from '../../../types/Opportunity'
import { LocationIcon, DateIcon, TimeIcon, SpotsIcon, SaveIcon } from '../../shared/icons'
import { formatOpportunityTimeRange } from '../../../utils/formatOpportunityTimeRange'
import { isPastOpportunityDate } from '../../../utils/isPastOpportunityDate'
import './OpportunityListItem.css'

type OpportunityListItemProps = {
  opportunity: Opportunity
  onRegister?: (opportunityId: string) => Promise<void>
  isFavorited?: boolean
  onToggleFavorite?: (opportunityId: string) => Promise<void>
  isRegistered?: boolean
  onCancelRegistration?: (opportunityId: string) => Promise<void>
  isWaitlisted?: boolean
  onJoinWaitlist?: (opportunityId: string) => Promise<void>
  onLeaveWaitlist?: (opportunityId: string) => Promise<void>
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

function OpportunityListItem({
  opportunity,
  onRegister,
  isFavorited = false,
  onToggleFavorite,
  isRegistered = false,
  onCancelRegistration,
  isWaitlisted = false,
  onJoinWaitlist,
  onLeaveWaitlist,
}: OpportunityListItemProps) {
    const [isRegistering, setIsRegistering] = useState(false)
    const [registerError, setRegisterError] = useState<string | null>(null)
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
    const [favoriteError, setFavoriteError] = useState<string | null>(null)
    const [isCancelling, setIsCancelling] = useState(false)
    const [cancelError, setCancelError] = useState<string | null>(null)
    const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false)
    const [waitlistError, setWaitlistError] = useState<string | null>(null)
    const [isLeavingWaitlist, setIsLeavingWaitlist] = useState(false)

    const isExpired = isPastOpportunityDate(opportunity.date)
    const isFull = opportunity.availableSpots <= 0
    const canRegister = !isExpired && !isFull && Boolean(onRegister) && !isRegistered
    const isWaitlist = isFull && !isRegistered
    const showExpiredStatus = isExpired && !isRegistered && !(isWaitlist && isWaitlisted)
    const spotsStatusClass = isFull
    ? 'opportunity-list-item-spots-full'
    : 'opportunity-list-item-spots-open'
    const displayTime = formatOpportunityTimeRange(
        opportunity.startTime,
        opportunity.endTime,
        opportunity.time,
    )

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

    async function handleCancelClick() {
        if (!onCancelRegistration) {
        return
        }

        const confirmed = window.confirm(
            'Are you sure you want to cancel this registration?',
        )

        if (!confirmed) {
        return
        }

        setIsCancelling(true)
        setCancelError(null)

        try {
        await onCancelRegistration(opportunity.opportunityId)
        } catch (err) {
        setCancelError(
            err instanceof Error ? err.message : 'Unable to cancel this registration.',
        )
        } finally {
        setIsCancelling(false)
        }
    }

    async function handleJoinWaitlistClick() {
        if (!onJoinWaitlist) {
        return
        }

        setIsJoiningWaitlist(true)
        setWaitlistError(null)

        try {
        await onJoinWaitlist(opportunity.opportunityId)
        } catch (err) {
        setWaitlistError(
            err instanceof Error ? err.message : 'Unable to join the waitlist.',
        )
        } finally {
        setIsJoiningWaitlist(false)
        }
    }

    async function handleLeaveWaitlistClick() {
        if (!onLeaveWaitlist) {
        return
        }

        setIsLeavingWaitlist(true)
        setWaitlistError(null)

        try {
        await onLeaveWaitlist(opportunity.opportunityId)
        } catch (err) {
        setWaitlistError(
            err instanceof Error ? err.message : 'Unable to leave the waitlist.',
        )
        } finally {
        setIsLeavingWaitlist(false)
        }
    }

    async function handleToggleFavoriteClick(event: MouseEvent) {
        // The card is covered by a stretched link to the details page - stop the
        // click from also triggering that navigation.
        event.preventDefault()
        event.stopPropagation()

        if (!onToggleFavorite || isTogglingFavorite) {
        return
        }

        setIsTogglingFavorite(true)
        setFavoriteError(null)

        try {
        await onToggleFavorite(opportunity.opportunityId)
        } catch (err) {
        setFavoriteError(
            err instanceof Error ? err.message : 'Unable to update favorites.',
        )
        } finally {
        setIsTogglingFavorite(false)
        }
    }

  return (
    <article className="opportunity-list-item">
      <Link
        to={`/opportunities/${opportunity.opportunityId}`}
        className="opportunity-list-item-stretched-link"
        aria-label={`View details for ${opportunity.title}`}
      />

      {opportunity.imageUrl ? (
        <img
          className="opportunity-list-item-image"
          src={opportunity.imageUrl}
          alt={`${opportunity.title} image`}
        />
      ) : (
        <div className="opportunity-list-item-image-placeholder" aria-hidden="true" />
      )}

      {onToggleFavorite && (
        <button
          type="button"
          className={
            isFavorited
              ? 'opportunity-list-item-favorite-button is-favorited'
              : 'opportunity-list-item-favorite-button'
          }
          onClick={handleToggleFavoriteClick}
          disabled={isTogglingFavorite}
          aria-pressed={isFavorited}
          aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          <SaveIcon
            className="opportunity-list-item-favorite-icon"
            aria-hidden="true"
            fill={isFavorited ? 'currentColor' : 'none'}
          />
        </button>
      )}

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
            {displayTime && (
              <li>
                <TimeIcon className="opportunity-list-item-meta-icon" aria-hidden="true" />
                {displayTime}
              </li>
            )}
            <li className={spotsStatusClass}>
              <SpotsIcon className="opportunity-list-item-meta-icon" aria-hidden="true" />
              {isFull
                ? 'Full'
                : `${opportunity.availableSpots} / ${opportunity.capacity} available`}
            </li>
          </ul>

          {isRegistered && (
            <div className="opportunity-list-item-actions">
              <span className="opportunity-list-item-registered-badge">Registered</span>
              {onCancelRegistration && (
                <button
                  type="button"
                  className="opportunity-list-item-cancel-button"
                  onClick={handleCancelClick}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Registration'}
                </button>
              )}
              {cancelError && (
                <p role="alert" className="opportunity-list-item-register-error">
                  {cancelError}
                </p>
              )}
            </div>
          )}
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
          {isWaitlist && isWaitlisted && (
            <div className="opportunity-list-item-actions">
              <span className="opportunity-list-item-waitlisted-badge">Waitlisted</span>
              {onLeaveWaitlist && (
                <button
                  type="button"
                  className="opportunity-list-item-leave-waitlist-button"
                  onClick={handleLeaveWaitlistClick}
                  disabled={isLeavingWaitlist}
                >
                  {isLeavingWaitlist ? 'Leaving...' : 'Leave Waitlist'}
                </button>
              )}
              {waitlistError && (
                <p role="alert" className="opportunity-list-item-register-error">
                  {waitlistError}
                </p>
              )}
            </div>
          )}
          {isWaitlist && !isWaitlisted && !isExpired && (
            <div className="opportunity-list-item-actions">
              <button
                type="button"
                className="opportunity-list-item-waitlist-button"
                onClick={handleJoinWaitlistClick}
                disabled={!onJoinWaitlist || isJoiningWaitlist}
              >
                {isJoiningWaitlist ? 'Joining...' : 'Join Waitlist'}
              </button>
              {waitlistError && (
                <p role="alert" className="opportunity-list-item-register-error">
                  {waitlistError}
                </p>
              )}
            </div>
          )}
          {showExpiredStatus && (
            <div className="opportunity-list-item-actions">
              <span className="opportunity-list-item-completed-badge">Completed</span>
            </div>
          )}
        </div>

        {favoriteError && (
          <p role="alert" className="opportunity-list-item-favorite-error">
            {favoriteError}
          </p>
        )}
      </div>
    </article>
  )
}

export default OpportunityListItem