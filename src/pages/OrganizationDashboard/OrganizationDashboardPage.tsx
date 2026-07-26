import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import './OrganizationDashboardPage.css'

function OrganizationDashboardPage() {
  const auth = useAppAuth()

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

      <section className="organization-dashboard-coming-soon">
        <h2>Coming soon</h2>
        <ul>
          <li>Open Opportunities</li>
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
