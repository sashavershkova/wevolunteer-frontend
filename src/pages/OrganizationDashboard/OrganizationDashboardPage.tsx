import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import OpportunitiesListView from '../../components/opportunities/OpportunitiesListView/OpportunitiesListView'
import type { Opportunity } from '../../types/Opportunity'
import './OrganizationDashboardPage.css'

function OrganizationDashboardPage() {
  const auth = useAppAuth()
  const { accessToken } = auth

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true)
  const [opportunitiesError, setOpportunitiesError] =
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

  return (
    <main className="organization-dashboard-page">
      <h1>Organization Dashboard</h1>

      <section className="organization-dashboard-details">
        <h2>{organization.name}</h2>
        <p>{organization.description}</p>
        <p>Email: {organization.email}</p>
        <p>Website: {organization.website}</p>
      </section>

      <button type="button" disabled>
        Create Opportunity
      </button>

      <section className="organization-dashboard-opportunities">
        <h2>Your Opportunities</h2>
        <OpportunitiesListView
          opportunities={opportunities}
          isLoading={isOpportunitiesLoading}
          error={opportunitiesError}
          emptyMessage="You have not created any opportunities yet."
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
