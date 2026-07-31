import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { getOpportunity, registerForOpportunity } from '../../services/api/opportunityService'
import { getOrganization, type OrganizationProfile } from '../../services/api/organizationService'
import {
  cancelMyRegistration,
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'
import {
  getMyFavorites,
  removeFavorite,
  saveFavorite,
  type Favorite,
} from '../../services/api/favoriteService'
import type { Opportunity } from '../../types/Opportunity'
import {
  ChecklistIcon,
  DateIcon,
  LocationIcon,
  SaveIcon,
  SpotsIcon,
  TimeIcon,
} from '../../components/shared/icons'
import { formatOpportunityTimeRange } from '../../utils/formatOpportunityTimeRange'
import './OpportunityDetailsPage.css'

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

function OpportunityDetailsPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>()
  const auth = useAppAuth()

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [isActionPending, setIsActionPending] = useState(false)
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null)

  const [isFavorited, setIsFavorited] = useState(false)
  const [isFavoritePending, setIsFavoritePending] = useState(false)
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.accessToken || !opportunityId) {
      return
    }

    let ignore = false

    const loadDetails = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const foundOpportunity = await getOpportunity(auth.accessToken, opportunityId)

        if (ignore) {
          return
        }

        if (foundOpportunity === null) {
          setOpportunity(null)
          setErrorMessage('This opportunity could not be found.')
          return
        }

        setOpportunity(foundOpportunity)

        const [organizationResult, registrations, favorites] = await Promise.all([
          getOrganization(auth.accessToken, foundOpportunity.organizationId),
          auth.userProfile
            ? getMyRegistrations(auth.accessToken)
            : Promise.resolve([] as Registration[]),
          auth.userProfile
            ? getMyFavorites(auth.accessToken)
            : Promise.resolve([] as Favorite[]),
        ])

        if (ignore) {
          return
        }

        setOrganization(organizationResult)
        setIsRegistered(
          registrations.some(
            (registration) => registration.opportunityId === foundOpportunity.opportunityId,
          ),
        )
        setIsFavorited(
          favorites.some(
            (favorite) => favorite.opportunityId === foundOpportunity.opportunityId,
          ),
        )
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load this opportunity.',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadDetails()

    return () => {
      ignore = true
    }
  }, [auth.accessToken, auth.userProfile, opportunityId])

  async function handleRegister() {
    if (!auth.userProfile || !opportunity) {
      return
    }

    setActionErrorMessage(null)
    setIsActionPending(true)

    try {
      await registerForOpportunity(auth.accessToken, auth.userProfile.userId, opportunity.opportunityId)

      setIsRegistered(true)
      setOpportunity({
        ...opportunity,
        registeredCount: opportunity.registeredCount + 1,
        availableSpots: opportunity.availableSpots - 1,
      })
    } catch (error) {
      setActionErrorMessage(
        error instanceof Error ? error.message : 'Unable to register for this opportunity.',
      )
    } finally {
      setIsActionPending(false)
    }
  }

  async function handleCancel() {
    if (!opportunity) {
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel this registration?',
    )

    if (!confirmed) {
      return
    }

    setActionErrorMessage(null)
    setIsActionPending(true)

    try {
      await cancelMyRegistration(auth.accessToken, opportunity.opportunityId)

      setIsRegistered(false)
      setOpportunity({
        ...opportunity,
        registeredCount: opportunity.registeredCount - 1,
        availableSpots: opportunity.availableSpots + 1,
      })
    } catch (error) {
      setActionErrorMessage(
        error instanceof Error ? error.message : 'Unable to cancel this registration.',
      )
    } finally {
      setIsActionPending(false)
    }
  }

  async function handleToggleFavorite() {
    if (!auth.userProfile || !opportunity) {
      return
    }

    setFavoriteErrorMessage(null)
    setIsFavoritePending(true)

    try {
      if (isFavorited) {
        await removeFavorite(auth.accessToken, opportunity.opportunityId)
        setIsFavorited(false)
      } else {
        await saveFavorite(auth.accessToken, opportunity.opportunityId)
        setIsFavorited(true)
      }
    } catch (error) {
      setFavoriteErrorMessage(
        error instanceof Error ? error.message : 'Unable to update your saved opportunities.',
      )
    } finally {
      setIsFavoritePending(false)
    }
  }

  if (isLoading) {
    return (
      <main className="opportunity-details-page">
        <p role="status">Loading opportunity...</p>
      </main>
    )
  }

  if (errorMessage || opportunity === null) {
    return (
      <main className="opportunity-details-page">
        <Link to="/opportunities" className="opportunity-details-back-link">
          &larr; Back to opportunities
        </Link>
        <p role="alert">{errorMessage ?? 'This opportunity could not be found.'}</p>
      </main>
    )
  }

  const isClosed = opportunity.status === 'CLOSED'
  const isFull = opportunity.availableSpots <= 0
  const displayTime = formatOpportunityTimeRange(
    opportunity.startTime,
    opportunity.endTime,
    opportunity.time,
  )

  return (
    <main className="opportunity-details-page">
      <Link to="/opportunities" className="opportunity-details-back-link">
        &larr; Back to opportunities
      </Link>

      <div className="opportunity-details-top">
        {opportunity.imageUrl ? (
          <img
            className="opportunity-details-thumb"
            src={opportunity.imageUrl}
            alt={`${opportunity.title} image`}
          />
        ) : (
          <div className="opportunity-details-thumb" aria-hidden="true" />
        )}

        <div className="opportunity-details-title-col">
          <div className="opportunity-details-header">
            <h1>{opportunity.title}</h1>
          </div>

          <p className="opportunity-details-org-name">{opportunity.organizationName}</p>

          <div className="opportunity-details-badges">
            <span className="opportunity-details-category">{opportunity.category}</span>
            {opportunity.recurring && (
              <span className="opportunity-details-recurring-badge">Ongoing</span>
            )}
          </div>

          <dl className="opportunity-details-meta">
            <div>
              <dt>
                <DateIcon className="opportunity-details-meta-icon" aria-hidden="true" />
                Date
              </dt>
              <dd>{formatDate(opportunity.date)}</dd>
            </div>
            {displayTime && (
              <div>
                <dt>
                  <TimeIcon className="opportunity-details-meta-icon" aria-hidden="true" />
                  Time
                </dt>
                <dd>{displayTime}</dd>
              </div>
            )}
            <div>
              <dt>
                <LocationIcon className="opportunity-details-meta-icon" aria-hidden="true" />
                Location
              </dt>
              <dd>{opportunity.location}</dd>
            </div>
            <div
              className={
                isClosed
                  ? 'opportunity-details-meta-spots'
                  : isFull
                    ? 'opportunity-details-meta-spots opportunity-details-meta-spots-full'
                    : 'opportunity-details-meta-spots opportunity-details-meta-spots-open'
              }
            >
              <dt>
                <SpotsIcon className="opportunity-details-meta-icon" aria-hidden="true" />
                Spots
              </dt>
              <dd>
                {isClosed
                  ? 'Closed'
                  : isFull
                    ? 'Full'
                    : `${opportunity.availableSpots} / ${opportunity.capacity} available`}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="opportunity-details-grid">
        <div>
          <section className="opportunity-details-section">
            <h2>About the Opportunity</h2>
            <p>{opportunity.description}</p>
          </section>

          {opportunity.whatYoullDo.length > 0 && (
            <section className="opportunity-details-section">
              <h2>What You&apos;ll Do</h2>
              <ul className="opportunity-details-checklist">
                {opportunity.whatYoullDo.map((task) => (
                  <li key={task}>
                    <ChecklistIcon className="opportunity-details-checklist-icon" aria-hidden="true" />
                    {task}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {auth.userProfile && (
            <div className="opportunity-details-action-bar">
              {actionErrorMessage && (
                <p role="alert" className="opportunity-details-action-error">
                  {actionErrorMessage}
                </p>
              )}

              {isRegistered ? (
                <>
                  <p className="opportunity-details-registered-note">You&apos;re registered</p>
                  <button
                    type="button"
                    className="opportunity-details-cancel-button"
                    disabled={isActionPending}
                    onClick={handleCancel}
                  >
                    {isActionPending ? 'Cancelling...' : 'Cancel registration'}
                  </button>
                </>
              ) : isClosed || isFull ? (
                <button type="button" className="opportunity-details-cancel-button" disabled>
                  {isClosed ? 'Registration closed' : 'This opportunity is full'}
                </button>
              ) : (
                <button
                  type="button"
                  className="opportunity-details-register-button"
                  disabled={isActionPending}
                  onClick={handleRegister}
                >
                  {isActionPending ? 'Registering...' : 'Register'}
                </button>
              )}

              <button
                type="button"
                className="opportunity-details-save-button"
                disabled={isFavoritePending}
                onClick={handleToggleFavorite}
                aria-pressed={isFavorited}
              >
                <SaveIcon className="opportunity-details-save-icon" aria-hidden="true" />
                {isFavoritePending ? 'Saving...' : isFavorited ? 'Saved' : 'Save'}
              </button>

              {favoriteErrorMessage && (
                <p role="alert" className="opportunity-details-action-error">
                  {favoriteErrorMessage}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          {organization && (
            <div className="opportunity-details-org-card">
              <h2>About the Organization</h2>
              <p>{organization.description}</p>
              {organization.website && (
                <a href={organization.website} target="_blank" rel="noreferrer">
                  Visit website &rarr;
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default OpportunityDetailsPage
