import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import OrganizationProfileSection from '../../components/organization/OrganizationProfileSection/OrganizationProfileSection'
import OrganizationMissionCard from '../../components/organization/OrganizationMissionCard/OrganizationMissionCard'
import OrganizationDetailsPreview from '../../components/organization/OrganizationDetailsPreview/OrganizationDetailsPreview'
import OrganizationVerificationPreview from '../../components/organization/OrganizationVerificationPreview/OrganizationVerificationPreview'
import OrganizationProfileCompletionPreview from '../../components/organization/OrganizationProfileCompletionPreview/OrganizationProfileCompletionPreview'
import './OrganizationProfilePage.css'

const PLANNED_PROFILE_FEATURES = [
  'Public organization profile',
  'Organization verification',
  'Service areas and causes',
  'Social media links',
  'Team member management',
]

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

  const organization = auth.organizationProfile

  return (
    <main className="organization-profile-page">
      <OrganizationProfileSection organization={organization} headingLevel="h1" />

      <OrganizationMissionCard description={organization.description} />

      <div className="organization-profile-page-row">
        <OrganizationDetailsPreview />
        <OrganizationVerificationPreview />
      </div>

      <div className="organization-profile-page-row">
        <OrganizationProfileCompletionPreview organization={organization} />

        <section
          className="organization-profile-page-planned-features"
          aria-label="Planned profile features"
        >
          <h2>Planned Profile Features</h2>
          <ul>
            {PLANNED_PROFILE_FEATURES.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

export default OrganizationProfilePage
