import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { OpportunitiesIcon, RegistrationsIcon, VolunteersIcon, ProfileIcon } from '../../components/shared/icons'
import MetricCard from '../../components/shared/MetricCard/MetricCard'
import UpcomingOpportunityList from '../../components/organization/UpcomingOpportunityList/UpcomingOpportunityList'
import type { Opportunity } from '../../types/Opportunity'
import { getOpportunityDisplayStatus } from '../../utils/getOpportunityDisplayStatus'
import './OrganizationDashboardPage.css'

const UPCOMING_WINDOW_DAYS = 30
const MAX_UPCOMING_OPPORTUNITIES = 3

function formatAsDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getUpcomingWindowEndDate(windowDays: number): string {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + windowDays)
  return formatAsDateString(end)
}

function OrganizationDashboardPage() {
  const auth = useAppAuth()
  const { accessToken } = auth

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true)
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null)

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

  // "Open" is the total pool of currently-active listings; "Upcoming" narrows that same
  // pool to what's happening soon (within UPCOMING_WINDOW_DAYS), so the two numbers only
  // diverge once an organization has open opportunities scheduled further out.
  const openOpportunitiesCount = opportunities.filter(
    (opportunity) => getOpportunityDisplayStatus(opportunity) === 'OPEN',
  ).length

  const upcomingWindowEndDate = getUpcomingWindowEndDate(UPCOMING_WINDOW_DAYS)

  const upcomingOpportunitiesCount = opportunities.filter(
    (opportunity) =>
      getOpportunityDisplayStatus(opportunity) === 'OPEN' &&
      opportunity.date <= upcomingWindowEndDate,
  ).length

  const totalRegistrationsCount = opportunities.reduce(
    (total, opportunity) => total + opportunity.registeredCount,
    0,
  )

  const totalCapacityCount = opportunities.reduce(
    (total, opportunity) => total + opportunity.capacity,
    0,
  )

  function formatMetric(value: number): string {
    return showMetricsPlaceholder ? '—' : String(value)
  }

  return (
    <main className="organization-dashboard-page">
      <header className="organization-dashboard-header">
        <h1>Welcome back, {organization.name}</h1>
        <p className="organization-dashboard-subtitle">
          Here&rsquo;s what&rsquo;s happening with your volunteer opportunities.
        </p>
      </header>

      <section
        className="organization-dashboard-metrics"
        aria-label="Opportunity metrics"
        aria-live="polite"
      >
        <MetricCard
          label="Open Opportunities"
          value={formatMetric(openOpportunitiesCount)}
          hint="Currently accepting volunteers"
        />

        <MetricCard
          label={`Upcoming (${UPCOMING_WINDOW_DAYS} days)`}
          value={formatMetric(upcomingOpportunitiesCount)}
          hint="Open opportunities happening soon"
        />

        <MetricCard
          label="Total Registrations"
          value={formatMetric(totalRegistrationsCount)}
          hint="Across all opportunities"
        />

        <MetricCard
          label="Total Capacity"
          value={formatMetric(totalCapacityCount)}
          hint="Volunteer spots offered"
        />
      </section>

      <section className="organization-dashboard-upcoming" aria-label="Upcoming opportunities">
        <div className="organization-dashboard-section-header">
          <h2>Upcoming Opportunities</h2>
          <Link to="/organization/opportunities" className="organization-dashboard-view-all-link">
            View all opportunities
          </Link>
        </div>

        <UpcomingOpportunityList
          opportunities={opportunities}
          isLoading={isOpportunitiesLoading}
          error={opportunitiesError}
          maxItems={MAX_UPCOMING_OPPORTUNITIES}
        />
      </section>

      <section className="organization-dashboard-quick-actions" aria-label="Quick actions">
        <h2>Quick Actions</h2>

        <nav className="organization-dashboard-quick-actions-list">
          <Link to="/organization/opportunities/new" className="organization-dashboard-quick-action">
            + Create New Opportunity
          </Link>
          <Link to="/organization/opportunities" className="organization-dashboard-quick-action">
            <OpportunitiesIcon aria-hidden="true" size={16} />
            View All Opportunities
          </Link>
          <Link to="/organization/registrations" className="organization-dashboard-quick-action">
            <RegistrationsIcon aria-hidden="true" size={16} />
            View Registrations
          </Link>
          <Link to="/organization/volunteers" className="organization-dashboard-quick-action">
            <VolunteersIcon aria-hidden="true" size={16} />
            View Volunteers
          </Link>
          <Link to="/organization/profile" className="organization-dashboard-quick-action">
            <ProfileIcon aria-hidden="true" size={16} />
            View Organization Profile
          </Link>
        </nav>
      </section>
    </main>
  )
}

export default OrganizationDashboardPage
