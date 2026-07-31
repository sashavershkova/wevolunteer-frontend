import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { getOrganizationOpportunityRegistrations } from '../../services/api/registrationService'
import type { Registration } from '../../services/api/registrationService'
import OrganizationRegistrationGroup from '../../components/organization/OrganizationRegistrationGroup/OrganizationRegistrationGroup'
import OrganizationRegistrationFilters from '../../components/organization/OrganizationRegistrationFilters/OrganizationRegistrationFilters'
import MetricCard from '../../components/shared/MetricCard/MetricCard'
import type { Opportunity } from '../../types/Opportunity'
import { sortOrganizationOpportunities } from '../../utils/sortOrganizationOpportunities'
import {
  EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
  filterRegistrationOpportunities,
  type RegistrationOpportunityFiltersValue,
  type RegistrationOpportunityItem,
} from '../../utils/registrationOpportunityFilters'
import '../OrganizationDashboard/OrganizationDashboardPage.css'
import './OrganizationRegistrationsPage.css'

type RegistrationsState = {
  registrations: Registration[]
  isLoading: boolean
  error: string | null
}

function OrganizationRegistrationsPage() {
  const auth = useAppAuth()
  const { accessToken } = auth

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true)
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null)
  const [registrationsByOpportunityId, setRegistrationsByOpportunityId] = useState<
    Record<string, RegistrationsState>
  >({})
  const [filters, setFilters] = useState<RegistrationOpportunityFiltersValue>(
    EMPTY_REGISTRATION_OPPORTUNITY_FILTERS,
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

  // There is currently no single "all registrations for my opportunities" endpoint, so we
  // fetch each opportunity's registrations individually and settle them independently -
  // one failure must not block the others. If the backend later adds a bulk endpoint, this
  // effect is the only place that needs to change; the rest of the page just reads the map.
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

  const sortedOpportunities = useMemo(
    () => sortOrganizationOpportunities(opportunities),
    [opportunities],
  )

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

  const registrationItems: RegistrationOpportunityItem[] = sortedOpportunities.map(
    (opportunity) => {
      const state = registrationsByOpportunityId[opportunity.opportunityId]

      return {
        opportunity,
        registrations: state?.registrations ?? [],
        isLoading: state?.isLoading ?? true,
        error: state?.error ?? null,
      }
    },
  )

  // Summary metrics always describe all loaded organization data, never the filtered subset.
  const allRegistrationsSettled = registrationItems.every((item) => !item.isLoading)
  const showMetricsPlaceholder =
    isOpportunitiesLoading || opportunitiesError !== null || !allRegistrationsSettled

  const totalRegistrationsCount = registrationItems.reduce(
    (total, item) => total + (item.error ? 0 : item.registrations.length),
    0,
  )
  const opportunitiesWithRegistrationsCount = registrationItems.filter(
    (item) => !item.error && item.registrations.length > 0,
  ).length
  const totalCapacityCount = sortedOpportunities.reduce(
    (total, opportunity) => total + opportunity.capacity,
    0,
  )

  function formatMetric(value: number): string {
    return showMetricsPlaceholder ? '—' : String(value)
  }

  const filteredItems = filterRegistrationOpportunities(registrationItems, filters)

  return (
    <main className="organization-registrations-page">
      <header className="organization-registrations-header">
        <h1>Registrations</h1>
        <p className="organization-registrations-subtitle">
          Manage volunteer registrations across your opportunities.
        </p>
      </header>

      {isOpportunitiesLoading && (
        <p role="status" className="organization-registrations-message">
          Loading your opportunities...
        </p>
      )}

      {!isOpportunitiesLoading && opportunitiesError && (
        <p role="alert" className="organization-registrations-message">
          {opportunitiesError}
        </p>
      )}

      {!isOpportunitiesLoading && !opportunitiesError && sortedOpportunities.length === 0 && (
        <div className="organization-registrations-empty">
          <p className="organization-registrations-message">
            You have not created any opportunities yet.
          </p>
          <Link
            to="/organization/opportunities/new"
            className="organization-registrations-create-link"
          >
            Create New Opportunity
          </Link>
        </div>
      )}

      {!isOpportunitiesLoading && !opportunitiesError && sortedOpportunities.length > 0 && (
        <>
          <section
            className="organization-registrations-summary"
            aria-label="Registration summary"
            aria-live="polite"
          >
            <MetricCard
              label="Total Registrations"
              value={formatMetric(totalRegistrationsCount)}
              hint="Across all opportunities"
            />

            <MetricCard
              label="Opportunities With Registrations"
              value={formatMetric(opportunitiesWithRegistrationsCount)}
              hint="Have at least one volunteer"
            />

            <MetricCard
              label="Total Volunteer Capacity"
              value={formatMetric(totalCapacityCount)}
              hint="Volunteer spots offered"
            />
          </section>

          <OrganizationRegistrationFilters value={filters} onChange={setFilters} />

          <p className="organization-registrations-filtered-count">
            Showing {filteredItems.length} of {sortedOpportunities.length} opportunities
          </p>

          {filteredItems.length === 0 ? (
            <div className="organization-registrations-empty">
              <p className="organization-registrations-message">
                No opportunities match your filters.
              </p>
              <button
                type="button"
                className="organization-registrations-clear-filters-button"
                onClick={() => setFilters(EMPTY_REGISTRATION_OPPORTUNITY_FILTERS)}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="organization-registrations-groups">
              {filteredItems.map((item) => (
                <OrganizationRegistrationGroup
                  key={item.opportunity.opportunityId}
                  opportunity={item.opportunity}
                  registrations={item.registrations}
                  isLoading={item.isLoading}
                  error={item.error}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}

export default OrganizationRegistrationsPage
