import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import OrganizationOpportunitiesSection from '../../components/organization/OrganizationOpportunitiesSection/OrganizationOpportunitiesSection'
import './OrganizationOpportunitiesPage.css'

function OrganizationOpportunitiesPage() {
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
      </main>
    )
  }

  if (auth.organizationProfile === null) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="organization-opportunities-page">
      <OrganizationOpportunitiesSection headingLevel="h1" />
    </main>
  )
}

export default OrganizationOpportunitiesPage
