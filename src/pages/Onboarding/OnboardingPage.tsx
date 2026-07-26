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
    <main>
      <h1>Complete your profile</h1>

      <p>
        Your account is ready. Please give us a little more information so we
        can set up your WeVolunteer profile.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Account type</legend>

          <label>
            <input
              type="radio"
              name="role"
              value="VOLUNTEER"
              checked={role === 'VOLUNTEER'}
              onChange={() => handleRoleChange('VOLUNTEER')}
            />
            Volunteer
          </label>

          <label>
            <input
              type="radio"
              name="role"
              value="ORGANIZATION"
              checked={role === 'ORGANIZATION'}
              onChange={() => handleRoleChange('ORGANIZATION')}
            />
            Organization
          </label>
        </fieldset>

        <label>
          {role === 'ORGANIZATION' ? 'Organization name' : 'Name'}
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        {role === 'ORGANIZATION' && (
          <fieldset>
            <legend>Organization details</legend>

            <label>
              Organization email
              <input type="email" value={auth.email} readOnly />
            </label>

            <label>
              Description
              <textarea
                value={organizationDescription}
                onChange={(event) =>
                  setOrganizationDescription(event.target.value)
                }
                required
              />
            </label>

            <label>
              Website
              <input
                type="url"
                value={organizationWebsite}
                onChange={(event) =>
                  setOrganizationWebsite(event.target.value)
                }
                placeholder="https://example.org"
              />
            </label>
          </fieldset>
        )}

        {errorMessage && <p>{errorMessage}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating profile...' : 'Create profile'}
        </button>
      </form>

      <button type="button" onClick={auth.signOut}>
        Sign out
      </button>
    </main>
  )
}

export default OnboardingPage