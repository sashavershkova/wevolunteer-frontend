import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { UploadPhotoIcon } from '../../components/shared/icons'
import {
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'
import { isPastOpportunityDate } from '../../utils/isPastOpportunityDate'
import './ProfilePage.css'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ProfilePage() {
  const auth = useAppAuth()

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isActivityLoading, setIsActivityLoading] = useState(
    Boolean(auth.accessToken),
  )
  const [activityErrorMessage, setActivityErrorMessage] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (!auth.accessToken || auth.organizationProfile) {
      return
    }

    let ignore = false

    const loadRegistrations = async () => {
      setIsActivityLoading(true)
      setActivityErrorMessage(null)

      try {
        const result = await getMyRegistrations(auth.accessToken)

        if (!ignore) {
          setRegistrations(result)
        }
      } catch {
        if (!ignore) {
          setActivityErrorMessage('Unable to load your volunteer activity.')
        }
      } finally {
        if (!ignore) {
          setIsActivityLoading(false)
        }
      }
    }

    void loadRegistrations()

    return () => {
      ignore = true
    }
  }, [auth.accessToken, auth.organizationProfile])

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

  if (auth.organizationProfile !== null) {
    return <Navigate to="/organization" replace />
  }

  if (auth.userProfile === null) {
    return <Navigate to="/" replace />
  }

  const { name, email } = auth.userProfile

  const completedCount = registrations.filter((registration) =>
    isPastOpportunityDate(registration.date),
  ).length
  const upcomingCount = registrations.length - completedCount
  const totalCount = registrations.length

  return (
    <main className="profile-page">
      <h1>My Account</h1>

      <section className="profile-card">
        <div className="profile-avatar-area">
          <div
            className="profile-avatar"
            role="img"
            aria-label={`${name} avatar`}
          >
            {getInitials(name)}
          </div>
          <button type="button" className="profile-upload-button" disabled>
            <UploadPhotoIcon aria-hidden="true" />
            Upload Photo
          </button>
          <p className="profile-upload-note">
            Photo upload will be available soon.
          </p>
        </div>

        <dl className="profile-details">
          <div className="profile-detail-row">
            <dt>Name</dt>
            <dd>{name}</dd>
          </div>
          <div className="profile-detail-row">
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          <div className="profile-detail-row">
            <dt>Role</dt>
            <dd>Volunteer</dd>
          </div>
        </dl>
      </section>

      <section className="profile-activity">
        <h2>Your Volunteer Activity</h2>

        {isActivityLoading && (
          <p className="profile-activity-status">Loading activity...</p>
        )}

        {!isActivityLoading && activityErrorMessage && (
          <p
            role="alert"
            className="profile-activity-status profile-activity-error"
          >
            {activityErrorMessage}
          </p>
        )}

        {!isActivityLoading && !activityErrorMessage && (
          <div className="profile-activity-metrics">
            <div className="profile-activity-metric-card">
              <p className="profile-activity-metric-value">
                {upcomingCount}
              </p>
              <p className="profile-activity-metric-label">
                Upcoming Opportunities
              </p>
            </div>
            <div className="profile-activity-metric-card">
              <p className="profile-activity-metric-value">
                {completedCount}
              </p>
              <p className="profile-activity-metric-label">
                Completed Opportunities
              </p>
            </div>
            <div className="profile-activity-metric-card">
              <p className="profile-activity-metric-value">{totalCount}</p>
              <p className="profile-activity-metric-label">
                Total Registrations
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default ProfilePage
