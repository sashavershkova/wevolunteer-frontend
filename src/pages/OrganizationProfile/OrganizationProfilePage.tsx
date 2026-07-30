import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import OrganizationProfileSection from '../../components/organization/OrganizationProfileSection/OrganizationProfileSection'
import './OrganizationProfilePage.css'

function OrganizationProfilePage() {
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
    <main className="organization-profile-page">
      <OrganizationProfileSection organization={auth.organizationProfile} headingLevel="h1" />
    </main>
  )
}

export default OrganizationProfilePage
