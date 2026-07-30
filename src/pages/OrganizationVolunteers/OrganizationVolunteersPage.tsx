import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { getOrganizationOpportunityRegistrations } from '../../services/api/registrationService'
import type { Registration } from '../../services/api/registrationService'
import OrganizationVolunteerCard from '../../components/organization/OrganizationVolunteerCard/OrganizationVolunteerCard'
import OrganizationVolunteerFilters from '../../components/organization/OrganizationVolunteerFilters/OrganizationVolunteerFilters'
import type { Opportunity } from '../../types/Opportunity'
import { aggregateOrganizationVolunteers } from '../../utils/aggregateOrganizationVolunteers'
import {
  EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
  filterAndSortOrganizationVolunteers,
  type OrganizationVolunteerFiltersValue,
} from '../../utils/organizationVolunteerFilters'
import '../OrganizationDashboard/OrganizationDashboardPage.css'
import './OrganizationVolunteersPage.css'

type RegistrationsState = {
  registrations: Registration[]
  isLoading: boolean
  error: string | null
}

// This loading effect intentionally duplicates the two-effect Promise.allSettled
// pattern already used by OrganizationRegistrationsPage.tsx rather than extracting a
// shared hook. Extracting one now would require touching that page's already-tested
// implementation for marginal benefit on a single new consumer; if a third page needs
// the same data, that's the point to extract a `useOrganizationOpportunityRegistrations`
// hook both pages adopt together. Tracked as follow-up debt, not silently duplicated.
function OrganizationVolunteersPage() {
  const auth = useAppAuth()
  const { accessToken } = auth

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true)
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null)
  const [registrationsByOpportunityId, setRegistrationsByOpportunityId] = useState<
    Record<string, RegistrationsState>
  >({})
  const [filters, setFilters] = useState<OrganizationVolunteerFiltersValue>(
    EMPTY_ORGANIZATION_VOLUNTEER_FILTERS,
  )

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
            error instanceof Error ? error.message : 'Unable to load your opportunities.',
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

  useEffect(() => {
    let ignore = false

    if (!accessToken || opportunities.length === 0) {
      return
    }

    const loadAllRegistrations = async () => {
      setRegistrationsByOpportunityId((current) => {
        const next = { ...current }
        opportunities.forEach((opportunity) => {
          next[opportunity.opportunityId] = {
            registrations: [],
            isLoading: true,
            error: null,
          }
        })
        return next
      })

      const results = await Promise.allSettled(
        opportunities.map((opportunity) =>
          getOrganizationOpportunityRegistrations(accessToken, opportunity.opportunityId),
        ),
      )

      if (ignore) {
        return
      }

      setRegistrationsByOpportunityId((current) => {
        const next = { ...current }

        opportunities.forEach((opportunity, index) => {
          const result = results[index]

          next[opportunity.opportunityId] =
            result.status === 'fulfilled'
              ? { registrations: result.value, isLoading: false, error: null }
              : {
                  registrations: [],
                  isLoading: false,
                  error:
                    result.reason instanceof Error
                      ? result.reason.message
                      : 'Unable to load registered volunteers.',
                }
        })

        return next
      })
    }

    void loadAllRegistrations()

    return () => {
      ignore = true
    }
  }, [accessToken, opportunities])

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

  const registrationItems = opportunities.map((opportunity) => {
    const state = registrationsByOpportunityId[opportunity.opportunityId]

    return {
      opportunity,
      registrations: state?.registrations ?? [],
      isLoading: state?.isLoading ?? true,
      error: state?.error ?? null,
    }
  })

  const allSettled = registrationItems.every((item) => !item.isLoading)
  const hasPartialError = registrationItems.some((item) => item.error !== null)
  const showPlaceholder = isOpportunitiesLoading || opportunitiesError !== null || !allSettled

  const volunteers = allSettled
    ? aggregateOrganizationVolunteers(
        registrationItems
          .filter((item) => !item.error)
          .map((item) => ({ opportunity: item.opportunity, registrations: item.registrations })),
      )
    : []

  const totalVolunteersCount = volunteers.length
  const newVolunteersCount = volunteers.filter((volunteer) => volunteer.status === 'NEW').length
  const returningVolunteersCount = volunteers.filter(
    (volunteer) => volunteer.status === 'RETURNING',
  ).length
  const frequentVolunteersCount = volunteers.filter(
    (volunteer) => volunteer.status === 'FREQUENT',
  ).length

  function formatMetric(value: number): string {
    return showPlaceholder ? '—' : String(value)
  }

  const filteredVolunteers = filterAndSortOrganizationVolunteers(volunteers, filters)
  const hasNoVolunteersAtAll = allSettled && !hasPartialError && volunteers.length === 0

  return (
    <main className="organization-volunteers-page">
      <header className="organization-volunteers-header">
        <h1>Volunteers</h1>
        <p className="organization-volunteers-subtitle">
          A directory of volunteers who have registered for your opportunities.
        </p>
      </header>

      {isOpportunitiesLoading && (
        <p role="status" className="organization-volunteers-message">
          Loading your opportunities...
        </p>
      )}

      {!isOpportunitiesLoading && opportunitiesError && (
        <p role="alert" className="organization-volunteers-message">
          {opportunitiesError}
        </p>
      )}

      {!isOpportunitiesLoading && !opportunitiesError && !allSettled && (
        <p role="status" className="organization-volunteers-message">
          Loading volunteer directory...
        </p>
      )}

      {!isOpportunitiesLoading && !opportunitiesError && allSettled && hasPartialError && (
        <p role="alert" className="organization-volunteers-partial-warning">
          Some volunteer registration data could not be loaded. The directory may be
          incomplete.
        </p>
      )}

      {!isOpportunitiesLoading && !opportunitiesError && allSettled && hasNoVolunteersAtAll && (
        <div className="organization-volunteers-empty">
          <p className="organization-volunteers-message">
            No volunteers have registered for your opportunities yet.
          </p>
          <Link to="/organization/opportunities" className="organization-volunteers-empty-link">
            View My Opportunities
          </Link>
        </div>
      )}

      {!isOpportunitiesLoading &&
        !opportunitiesError &&
        allSettled &&
        !hasNoVolunteersAtAll &&
        volunteers.length > 0 && (
          <>
            <section
              className="organization-dashboard-metrics"
              aria-label="Volunteer summary"
              aria-live="polite"
            >
              <div className="organization-dashboard-metric-card">
                <p className="organization-dashboard-metric-label">Total Volunteers</p>
                <p className="organization-dashboard-metric-value">
                  {formatMetric(totalVolunteersCount)}
                </p>
                <p className="organization-dashboard-metric-hint">Unique volunteers found</p>
              </div>

              <div className="organization-dashboard-metric-card">
                <p className="organization-dashboard-metric-label">New Volunteers</p>
                <p className="organization-dashboard-metric-value">
                  {formatMetric(newVolunteersCount)}
                </p>
                <p className="organization-dashboard-metric-hint">Registered for 1 opportunity</p>
              </div>

              <div className="organization-dashboard-metric-card">
                <p className="organization-dashboard-metric-label">Returning Volunteers</p>
                <p className="organization-dashboard-metric-value">
                  {formatMetric(returningVolunteersCount)}
                </p>
                <p className="organization-dashboard-metric-hint">
                  Registered for 2 opportunities
                </p>
              </div>

              <div className="organization-dashboard-metric-card">
                <p className="organization-dashboard-metric-label">Frequent Volunteers</p>
                <p className="organization-dashboard-metric-value">
                  {formatMetric(frequentVolunteersCount)}
                </p>
                <p className="organization-dashboard-metric-hint">
                  Registered for 3 or more opportunities
                </p>
              </div>
            </section>

            <OrganizationVolunteerFilters value={filters} onChange={setFilters} />

            <p className="organization-volunteers-filtered-count">
              Showing {filteredVolunteers.length} of {volunteers.length} volunteers
            </p>

            {filteredVolunteers.length === 0 ? (
              <div className="organization-volunteers-empty">
                <p className="organization-volunteers-message">
                  No volunteers match your filters.
                </p>
                <button
                  type="button"
                  className="organization-volunteers-clear-filters-button"
                  onClick={() => setFilters(EMPTY_ORGANIZATION_VOLUNTEER_FILTERS)}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="organization-volunteers-list">
                {filteredVolunteers.map((volunteer) => (
                  <OrganizationVolunteerCard key={volunteer.userId} volunteer={volunteer} />
                ))}
              </div>
            )}
          </>
        )}
    </main>
  )
}

export default OrganizationVolunteersPage
