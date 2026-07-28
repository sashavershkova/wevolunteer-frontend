import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { createCurrentUser } from '../../services/api/userService'
import { createOrganization } from '../../services/api/organizationService'
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
      <div className="onboarding-card">
        <h1>Complete your profile</h1>

        <p className="onboarding-subtitle">
          Your account is ready. Please give us a little more information so we
          can set up your WeVolunteer profile.
        </p>

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
                <span className="onboarding-role-card-body">
                  <span className="onboarding-role-card-title">Volunteer</span>
                  <span className="onboarding-role-card-description">
                    Find and join volunteer opportunities in your community.
                  </span>
                </span>
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
                <span className="onboarding-role-card-body">
                  <span className="onboarding-role-card-title">Organization</span>
                  <span className="onboarding-role-card-description">
                    Post opportunities and manage volunteers for your organization.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

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
        </form>
      </div>
    </main>
  )
}

export default OnboardingPage