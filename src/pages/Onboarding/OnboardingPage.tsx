import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { createCurrentUser } from '../../services/api/userService'
import { createOrganization } from '../../services/api/organizationService'
import volunteerRoleImage from '../../assets/onboarding/volunteer-role.png'
import organizationRoleImage from '../../assets/onboarding/organization-role.png'
import './OnboardingPage.css'

type UserRole = 'VOLUNTEER' | 'ORGANIZATION'

function OnboardingPage() {
  const auth = useAppAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('VOLUNTEER')
  const [organizationDescription, setOrganizationDescription] = useState('')
  const [organizationWebsite, setOrganizationWebsite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!auth.accessToken) {
      setErrorMessage('Your authentication session is unavailable.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      if (role === 'VOLUNTEER') {
        const profile = await createCurrentUser(auth.accessToken, {
          name,
          email: auth.email,
          role,
        })

        auth.updateUserProfile(profile)
      } else {
        const organization = await createOrganization(auth.accessToken, {
          name,
          description: organizationDescription,
          email: auth.email,
          website: organizationWebsite,
        })

        auth.updateOrganizationProfile(organization)
        navigate('/organization', { replace: true })
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create your profile.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleRoleChange(newRole: UserRole) {
    setRole(newRole)
    setErrorMessage(null)
  }

  return (
    <main className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-intro">
          <h1>Complete your profile</h1>

          <p className="onboarding-subtitle">
            Your account is ready. Please give us a little more information so
            we can set up your WeVolunteer profile.
          </p>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <fieldset className="onboarding-role-fieldset">
            <legend>Account type</legend>

            <div className="onboarding-role-options">
              <label
                className={`onboarding-role-card${role === 'VOLUNTEER' ? ' is-selected' : ''}`}
                data-role="VOLUNTEER"
              >
                <input
                  type="radio"
                  name="role"
                  value="VOLUNTEER"
                  checked={role === 'VOLUNTEER'}
                  onChange={() => handleRoleChange('VOLUNTEER')}
                  className="onboarding-role-input"
                />
                <span className="onboarding-role-card-illustration">
                  <img
                    src={volunteerRoleImage}
                    alt=""
                    className="onboarding-role-card-image"
                  />
                </span>
                <span className="onboarding-role-card-title">I&apos;m a Volunteer</span>
                <span className="onboarding-role-card-description">
                  Find opportunities and make an impact in your community.
                </span>
                <span className="onboarding-role-card-action">Choose Volunteer</span>
              </label>

              <label
                className={`onboarding-role-card${role === 'ORGANIZATION' ? ' is-selected' : ''}`}
                data-role="ORGANIZATION"
              >
                <input
                  type="radio"
                  name="role"
                  value="ORGANIZATION"
                  checked={role === 'ORGANIZATION'}
                  onChange={() => handleRoleChange('ORGANIZATION')}
                  className="onboarding-role-input"
                />
                <span className="onboarding-role-card-illustration">
                  <img
                    src={organizationRoleImage}
                    alt=""
                    className="onboarding-role-card-image"
                  />
                </span>
                <span className="onboarding-role-card-title">I&apos;m an Organization</span>
                <span className="onboarding-role-card-description">
                  Post opportunities and connect with amazing volunteers.
                </span>
                <span className="onboarding-role-card-action">Choose Organization</span>
              </label>
            </div>
          </fieldset>

          <div className="onboarding-fields-card">
            <label className="onboarding-field">
              <span className="onboarding-field-label">
                {role === 'ORGANIZATION' ? 'Organization name' : 'Name'}
              </span>
              <input
                type="text"
                className="onboarding-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            {role === 'ORGANIZATION' && (
              <fieldset className="onboarding-org-fieldset">
                <legend>Organization details</legend>

                <label className="onboarding-field">
                  <span className="onboarding-field-label">Organization email</span>
                  <input
                    type="email"
                    className="onboarding-input"
                    value={auth.email}
                    readOnly
                  />
                </label>

                <label className="onboarding-field">
                  <span className="onboarding-field-label">Description</span>
                  <textarea
                    className="onboarding-textarea"
                    value={organizationDescription}
                    onChange={(event) =>
                      setOrganizationDescription(event.target.value)
                    }
                    required
                  />
                </label>

                <label className="onboarding-field">
                  <span className="onboarding-field-label">Website</span>
                  <input
                    type="url"
                    className="onboarding-input"
                    value={organizationWebsite}
                    onChange={(event) =>
                      setOrganizationWebsite(event.target.value)
                    }
                    placeholder="https://example.org"
                  />
                </label>
              </fieldset>
            )}

            {errorMessage && (
              <p role="alert" className="onboarding-error">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="onboarding-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating profile...' : 'Create profile'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default OnboardingPage