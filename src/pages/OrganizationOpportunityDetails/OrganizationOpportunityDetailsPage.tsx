import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { getOpportunity } from '../../services/api/opportunityService'
import {
  getOrganizationOpportunityRegistrations,
  type Registration,
} from '../../services/api/registrationService'
import {
  ChecklistIcon,
  DateIcon,
  EditIcon,
  LocationIcon,
  SpotsIcon,
  TimeIcon,
} from '../../components/shared/icons'
import ImageUploadField from '../../components/shared/ImageUploadField/ImageUploadField'
import {
  attachOpportunityImage,
  uploadOpportunityImage,
} from '../../services/api/imageService'
import { useImageUpload } from '../../hooks/useImageUpload'
import type { Opportunity } from '../../types/Opportunity'
import { formatOpportunityTimeRange } from '../../utils/formatOpportunityTimeRange'
import { isPastOpportunityDate } from '../../utils/isPastOpportunityDate'
import './OrganizationOpportunityDetailsPage.css'

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

function formatRegisteredAt(dateTimeString: string): string {
  const date = new Date(dateTimeString)

  if (Number.isNaN(date.getTime())) {
    return dateTimeString
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Registered',
}

function formatRegistrationStatus(status: string): string {
  const knownLabel = REGISTRATION_STATUS_LABELS[status]

  if (knownLabel) {
    return knownLabel
  }

  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function OrganizationOpportunityDetailsPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>()
  const auth = useAppAuth()

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const imageUpload = useImageUpload({
    onUpload: async (file) => {
      if (!auth.accessToken || !opportunityId) {
        throw new Error('Your authentication session is unavailable.')
      }

      const objectKey = await uploadOpportunityImage(auth.accessToken, file)

      setOpportunity(
        await attachOpportunityImage(auth.accessToken, opportunityId, objectKey),
      )
    },
  })

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isRegistrationsLoading, setIsRegistrationsLoading] = useState(true)
  const [registrationsError, setRegistrationsError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    const loadOpportunity = async () => {
      if (!opportunityId) {
        setIsLoading(false)
        setLoadError('No opportunity was specified.')
        return
      }

      if (!auth.accessToken) {
        setIsLoading(false)
        setLoadError('Your authentication session is unavailable.')
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await getOpportunity(auth.accessToken, opportunityId)

        if (ignore) {
          return
        }

        if (!result) {
          setLoadError('This opportunity could not be found.')
          setOpportunity(null)
          return
        }

        setOpportunity(result)
      } catch (error) {
        if (!ignore) {
          setLoadError(
            error instanceof Error ? error.message : 'Unable to load this opportunity.',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadOpportunity()

    return () => {
      ignore = true
    }
  }, [opportunityId, auth.accessToken])

  useEffect(() => {
    let ignore = false

    const loadRegistrations = async () => {
      if (!opportunityId || !auth.accessToken || !opportunity) {
        return
      }

      if (opportunity.organizationId !== auth.organizationProfile?.organizationId) {
        return
      }

      setIsRegistrationsLoading(true)
      setRegistrationsError(null)

      try {
        const result = await getOrganizationOpportunityRegistrations(
          auth.accessToken,
          opportunityId,
        )

        if (!ignore) {
          setRegistrations(result)
        }
      } catch (error) {
        if (!ignore) {
          setRegistrationsError(
            error instanceof Error ? error.message : 'Unable to load registered volunteers.',
          )
        }
      } finally {
        if (!ignore) {
          setIsRegistrationsLoading(false)
        }
      }
    }

    void loadRegistrations()

    return () => {
      ignore = true
    }
  }, [opportunityId, auth.accessToken, opportunity, auth.organizationProfile])

  if (auth.isProfileLoading) {
    return (
      <main>
        <h1>Loading your profile...</h1>
      </main>
    )
  }

  if (auth.profileErrorMessage) {
    return (
      <main>
        <h1>Unable to load your profile</h1>
        <p>{auth.profileErrorMessage}</p>
      </main>
    )
  }

  if (auth.organizationProfile === null) {
    return <Navigate to="/" replace />
  }

  const organization = auth.organizationProfile
  const isOwner =
    opportunity !== null && opportunity.organizationId === organization.organizationId
  const isPast = opportunity !== null && isPastOpportunityDate(opportunity.date)
  const displayTime = formatOpportunityTimeRange(
    opportunity?.startTime,
    opportunity?.endTime,
    opportunity?.time,
  )

  return (
    <main className="organization-opportunity-details-page">
      <Link to="/organization" className="organization-opportunity-details-back-link">
        &larr; Back to Dashboard
      </Link>

      {isLoading && (
        <p role="status" className="organization-opportunity-details-status">
          Loading opportunity...
        </p>
      )}

      {!isLoading && loadError && (
        <p role="alert" className="organization-opportunity-details-error">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && opportunity && !isOwner && (
        <p role="alert" className="organization-opportunity-details-error">
          Your organization cannot view this opportunity.
        </p>
      )}

      {!isLoading && !loadError && opportunity && isOwner && (
        <>
          <header className="organization-opportunity-details-header">
            <div className="organization-opportunity-details-title-row">
              <h1>{opportunity.title}</h1>
              {!isPast && (
                <Link
                  to={`/organization/opportunities/${opportunity.opportunityId}/edit`}
                  className="organization-opportunity-details-edit-link"
                  aria-label={`Edit ${opportunity.title}`}
                >
                  <EditIcon
                    aria-hidden="true"
                    className="organization-opportunity-details-edit-icon"
                  />
                  Edit
                </Link>
              )}
            </div>

            <div className="organization-opportunity-details-badges">
              <span
                className={`organization-opportunity-details-status-badge organization-opportunity-details-status-badge-${opportunity.status.toLowerCase()}`}
              >
                {opportunity.status === 'OPEN' ? 'Open' : 'Closed'}
              </span>
              {opportunity.recurring && (
                <span className="organization-opportunity-details-recurring-badge">Ongoing</span>
              )}
            </div>
          </header>

          <div className="organization-opportunity-details-content-row">
            <ImageUploadField
              inputId="organization-opportunity-image"
              imageUrl={opportunity.imageUrl}
              previewUrl={imageUpload.previewUrl}
              alt={`${opportunity.title} image`}
              isUploading={imageUpload.isUploading}
              errorMessage={imageUpload.errorMessage}
              onSelectFile={imageUpload.selectFile}
            />

            <dl className="organization-opportunity-details-meta">
              <div>
                <dt>
                  <DateIcon
                    aria-hidden="true"
                    className="organization-opportunity-details-meta-icon"
                  />
                  Date
                </dt>
                <dd>{formatDate(opportunity.date)}</dd>
              </div>
              {displayTime && (
                <div>
                  <dt>
                    <TimeIcon
                      aria-hidden="true"
                      className="organization-opportunity-details-meta-icon"
                    />
                    Time
                  </dt>
                  <dd>{displayTime}</dd>
                </div>
              )}
              <div>
                <dt>
                  <LocationIcon
                    aria-hidden="true"
                    className="organization-opportunity-details-meta-icon"
                  />
                  Location
                </dt>
                <dd>{opportunity.location}</dd>
              </div>
              <div>
                <dt>
                  <SpotsIcon
                    aria-hidden="true"
                    className="organization-opportunity-details-meta-icon"
                  />
                  Capacity
                </dt>
                <dd>{opportunity.capacity}</dd>
              </div>
              <div>
                <dt>Registered</dt>
                <dd>{opportunity.registeredCount}</dd>
              </div>
              <div>
                <dt>Available Spots</dt>
                <dd>{opportunity.availableSpots}</dd>
              </div>
            </dl>
          </div>

          <section className="organization-opportunity-details-section">
            <h2>Category</h2>
            <p>{opportunity.category}</p>
          </section>

          <section className="organization-opportunity-details-section">
            <h2>About the Opportunity</h2>
            <p>{opportunity.description}</p>
          </section>

          {opportunity.whatYoullDo.length > 0 && (
            <section className="organization-opportunity-details-section">
              <h2>What Volunteers Will Do</h2>
              <ul className="organization-opportunity-details-checklist">
                {opportunity.whatYoullDo.map((task) => (
                  <li key={task}>
                    <ChecklistIcon
                      aria-hidden="true"
                      className="organization-opportunity-details-checklist-icon"
                    />
                    {task}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="organization-opportunity-details-section">
            <h2>
              Registered Volunteers
              {!isRegistrationsLoading && !registrationsError && registrations.length > 0
                ? ` (${registrations.length})`
                : ''}
            </h2>

            {isRegistrationsLoading && (
              <p role="status" className="organization-opportunity-details-status">
                Loading registered volunteers...
              </p>
            )}

            {!isRegistrationsLoading && registrationsError && (
              <p role="alert" className="organization-opportunity-details-error">
                {registrationsError}
              </p>
            )}

            {!isRegistrationsLoading && !registrationsError && registrations.length === 0 && (
              <p className="organization-opportunity-details-placeholder-note">
                No volunteers have registered for this opportunity yet.
              </p>
            )}

            {!isRegistrationsLoading && !registrationsError && registrations.length > 0 && (
              <div className="organization-opportunity-details-registrations-table-container">
                <table className="organization-opportunity-details-registrations-table">
                  <thead>
                    <tr>
                      <th scope="col">Volunteer</th>
                      <th scope="col">Email</th>
                      <th scope="col">Status</th>
                      <th scope="col">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration) => (
                      <tr key={registration.userId}>
                        <td data-label="Volunteer">
                          {registration.volunteerName ?? 'Unknown volunteer'}
                        </td>
                        <td data-label="Email">{registration.email ?? 'Not provided'}</td>
                        <td data-label="Status">
                          {formatRegistrationStatus(registration.registrationStatus)}
                        </td>
                        <td data-label="Registered">
                          {formatRegisteredAt(registration.registeredAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default OrganizationOpportunityDetailsPage
