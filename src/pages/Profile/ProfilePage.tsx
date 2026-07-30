import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { UploadPhotoIcon } from '../../components/shared/icons'
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
    </main>
  )
}

export default ProfilePage
