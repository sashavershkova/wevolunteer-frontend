import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import type { Opportunity } from '../../types/Opportunity'
import './OrganizationDashboardPage.css'

function OrganizationDashboardPage() {
  const auth = useAppAuth()
  const { accessToken } = auth

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])

  useEffect(() => {
    let ignore = false

    if (!accessToken) {
      return
    }

    const loadOpportunities = async () => {
      const result = await getMyOrganizationOpportunities(accessToken)

      if (!ignore) {
        setOpportunities(result)
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

        <button type="button" onClick={auth.signOut}>
          Sign out
        </button>
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
        {opportunities.length === 0 ? (
          <p>You have not created any opportunities yet.</p>
        ) : (
          <ul>
            {opportunities.map((opportunity) => (
              <li key={opportunity.opportunityId}>{opportunity.title}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="organization-dashboard-coming-soon">
        <h2>Coming soon</h2>
        <ul>
          <li>Volunteer Registrations</li>
          <li>Organization Settings</li>
        </ul>
      </section>

      <button type="button" onClick={auth.signOut}>
        Sign out
      </button>
    </main>
  )
}

export default OrganizationDashboardPage
