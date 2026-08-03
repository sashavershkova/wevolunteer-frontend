import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import ImageUploadField from '../../components/shared/ImageUploadField/ImageUploadField'
import AboutMeCard from '../../components/volunteer/VolunteerAboutMeCard/AboutMeCard'
import { useImageUpload } from '../../hooks/useImageUpload'
import { uploadUserProfileImage } from '../../services/api/imageService'
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

  const imageUpload = useImageUpload({
    onUpload: async (file) => {
      if (!auth.accessToken) {
        throw new Error('Your authentication session is unavailable.')
      }

      // The response carries a freshly signed URL for the new photo, so the
      // profile in context is replaced rather than patched locally.
      auth.updateUserProfile(await uploadUserProfileImage(auth.accessToken, file))
    },
  })

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

  const { name, email, profileImageUrl } = auth.userProfile

  return (
    <main className="profile-page">
      <h1>My Profile</h1>

      <section className="profile-card">
        <div className="profile-avatar-area">
          <ImageUploadField
            inputId="profile-photo"
            variant="avatar"
            imageUrl={profileImageUrl}
            previewUrl={imageUpload.previewUrl}
            alt={`${name} profile photo`}
            uploadLabel="Upload Photo"
            replaceLabel="Replace Photo"
            fallback={
              <span
                className="profile-avatar-initials"
                role="img"
                aria-label={`${name} avatar`}
              >
                {getInitials(name)}
              </span>
            }
            isUploading={imageUpload.isUploading}
            errorMessage={imageUpload.errorMessage}
            onSelectFile={imageUpload.selectFile}
          />
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

      <AboutMeCard />
    </main>
  )
}

export default ProfilePage