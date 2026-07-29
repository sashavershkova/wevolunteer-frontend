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
import type { Opportunity } from '../../types/Opportunity'
import { DateIcon, LocationIcon, SpotsIcon } from '../../components/shared/icons'
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

        const [organizationResult, registrations] = await Promise.all([
          getOrganization(auth.accessToken, foundOpportunity.organizationId),
          auth.userProfile
            ? getMyRegistrations(auth.accessToken)
            : Promise.resolve([] as Registration[]),
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

  return (
    <main className="opportunity-details-page">
      <Link to="/opportunities" className="opportunity-details-back-link">
        &larr; Back to opportunities
      </Link>

      <div className="opportunity-details-grid">
        <div>
          <div className="opportunity-details-top">
            <div className="opportunity-details-thumb" aria-hidden="true" />

            <div className="opportunity-details-title-col">
              <div className="opportunity-details-header">
                <h1>{opportunity.title}</h1>
              </div>

              <div className="opportunity-details-badges">
                <span className="opportunity-details-category">{opportunity.category}</span>
              </div>

              <p className="opportunity-details-org-name">{opportunity.organizationName}</p>
            </div>
          </div>

          <dl className="opportunity-details-meta">
            <div>
              <dt>
                <DateIcon className="opportunity-details-meta-icon" aria-hidden="true" />
                Date
              </dt>
              <dd>{formatDate(opportunity.date)}</dd>
            </div>
            <div>
              <dt>
                <LocationIcon className="opportunity-details-meta-icon" aria-hidden="true" />
                Location
              </dt>
              <dd>{opportunity.location}</dd>
            </div>
            <div className="opportunity-details-meta-spots">
              <dt>
                <SpotsIcon className="opportunity-details-meta-icon" aria-hidden="true" />
                Spots
              </dt>
              <dd>
                {isClosed
                  ? 'Closed'
                  : isFull
                    ? 'Full'
                    : `${opportunity.availableSpots} of ${opportunity.capacity} open`}
              </dd>
            </div>
          </dl>

          <section className="opportunity-details-section">
            <h2>About the Opportunity</h2>
            <p>{opportunity.description}</p>
          </section>
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
        </div>
      )}
    </main>
  )
}

export default OpportunityDetailsPage
