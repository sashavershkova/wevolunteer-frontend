import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { closeOpportunity } from '../../services/api/opportunityService'
import OrganizationOpportunitiesTable from '../../components/organization/OrganizationOpportunitiesTable/OrganizationOpportunitiesTable'
import { OrganizationIcon } from '../../components/shared/icons'
import type { Opportunity } from '../../types/Opportunity'
import './OrganizationDashboardPage.css'

function OrganizationDashboardPage() {
  const auth = useAppAuth()
  const navigate = useNavigate()
  const { accessToken } = auth

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true)
  const [opportunitiesError, setOpportunitiesError] =
    useState<string | null>(null)
  const [closingOpportunityId, setClosingOpportunityId] =
    useState<string | null>(null)
  const [closeErrorMessage, setCloseErrorMessage] =
    useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    if (!accessToken) {
      return
    }

    const loadOpportunities = async () => {
      setIsOpportunitiesLoading(true)
      setOpportunitiesError(null)

      try {
        const result = await getMyOrganizationOpportunities(accessToken)

        if (!ignore) {
          setOpportunities(result)
        }
      } catch (error) {
        if (!ignore) {
          setOpportunitiesError(
            error instanceof Error
              ? error.message
              : 'Unable to load your opportunities.',
          )
        }
      } finally {
        if (!ignore) {
          setIsOpportunitiesLoading(false)
        }
      }
    }

    void loadOpportunities()

    return () => {
      ignore = true
    }
  }, [accessToken])

  async function handleCloseOpportunity(opportunityId: string) {
    if (!accessToken) {
      setCloseErrorMessage('Your authentication session is unavailable.')
      return
    }

    setCloseErrorMessage(null)
    setClosingOpportunityId(opportunityId)

    try {
      const updatedOpportunity = await closeOpportunity(accessToken, opportunityId)

      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.opportunityId === updatedOpportunity.opportunityId
            ? updatedOpportunity
            : opportunity,
        ),
      )
    } catch (error) {
      setCloseErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to close this opportunity.',
      )
    } finally {
      setClosingOpportunityId(null)
    }
  }

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

  const showMetricsPlaceholder = isOpportunitiesLoading || opportunitiesError !== null

  const activeOpportunitiesCount = opportunities.filter(
    (opportunity) => opportunity.status === 'OPEN',
  ).length

  const closedOpportunitiesCount = opportunities.filter(
    (opportunity) => opportunity.status === 'CLOSED',
  ).length

  const totalRegistrations = opportunities.reduce(
    (total, opportunity) => total + opportunity.registeredCount,
    0,
  )

  const totalCapacity = opportunities.reduce(
    (total, opportunity) => total + opportunity.capacity,
    0,
  )

  function formatMetric(value: number): string {
    return showMetricsPlaceholder ? '—' : String(value)
  }

  return (
    <main className="organization-dashboard-page">
      <header className="organization-dashboard-header">
        <h1>Organization Dashboard</h1>
        <p className="organization-dashboard-subtitle">
          Manage your opportunities and connect with volunteers.
        </p>
      </header>

      <section
        className="organization-dashboard-metrics"
        aria-label="Opportunity metrics"
        aria-live="polite"
      >
        <div className="organization-dashboard-metric-card">
          <p className="organization-dashboard-metric-label">Active Opportunities</p>
          <p className="organization-dashboard-metric-value">
            {formatMetric(activeOpportunitiesCount)}
          </p>
          <p className="organization-dashboard-metric-hint">Currently open</p>
        </div>

        <div className="organization-dashboard-metric-card">
          <p className="organization-dashboard-metric-label">Closed Opportunities</p>
          <p className="organization-dashboard-metric-value">
            {formatMetric(closedOpportunitiesCount)}
          </p>
          <p className="organization-dashboard-metric-hint">No longer accepting volunteers</p>
        </div>

        <div className="organization-dashboard-metric-card">
          <p className="organization-dashboard-metric-label">Total Registrations</p>
          <p className="organization-dashboard-metric-value">
            {formatMetric(totalRegistrations)}
          </p>
          <p className="organization-dashboard-metric-hint">Across all opportunities</p>
        </div>

        <div className="organization-dashboard-metric-card">
          <p className="organization-dashboard-metric-label">Total Capacity</p>
          <p className="organization-dashboard-metric-value">
            {formatMetric(totalCapacity)}
          </p>
          <p className="organization-dashboard-metric-hint">Volunteer spots offered</p>
        </div>
      </section>

      <section
        className="organization-dashboard-overview"
        aria-label="Organization overview"
      >
        <div className="organization-dashboard-profile">
          <div className="organization-dashboard-logo-placeholder">
            <div className="organization-dashboard-logo-circle">
              <OrganizationIcon aria-hidden="true" />
            </div>
            <button type="button" className="organization-dashboard-upload-button" disabled>
              Upload logo
            </button>
            <p className="organization-dashboard-logo-note">
              Logo upload will be available soon.
            </p>
          </div>

          <div className="organization-dashboard-details">
            <h2>{organization.name}</h2>

            {organization.description && (
              <p className="organization-dashboard-description">
                {organization.description}
              </p>
            )}

            <dl className="organization-dashboard-meta">
              <div>
                <dt>Email</dt>
                <dd>{organization.email}</dd>
              </div>

              {organization.website && (
                <div>
                  <dt>Website</dt>
                  <dd>
                    <a href={organization.website} target="_blank" rel="noreferrer">
                      {organization.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      <section className="organization-dashboard-opportunities">
        <div className="organization-dashboard-opportunities-header">
          <h2>My Opportunities</h2>

          <button
            type="button"
            className="organization-dashboard-create-button"
            onClick={() => navigate('/organization/opportunities/new')}
          >
            + Create New Opportunity
          </button>
        </div>

        {closeErrorMessage && (
          <p role="alert" className="organization-dashboard-close-error">
            {closeErrorMessage}
          </p>
        )}

        <OrganizationOpportunitiesTable
          opportunities={opportunities}
          isLoading={isOpportunitiesLoading}
          error={opportunitiesError}
          onCloseOpportunity={handleCloseOpportunity}
          closingOpportunityId={closingOpportunityId}
        />
      </section>

      <section className="organization-dashboard-coming-soon">
        <h2>Coming soon</h2>
        <ul>
          <li>Volunteer Registrations</li>
          <li>Organization Settings</li>
        </ul>
      </section>
    </main>
  )
}

export default OrganizationDashboardPage
