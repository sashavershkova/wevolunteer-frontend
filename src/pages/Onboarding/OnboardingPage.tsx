import { useState, type FormEvent } from 'react'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  createCurrentUser,
  type UserProfile,
} from '../../services/api/userService'
import './OnboardingPage.css'

type UserRole = 'VOLUNTEER' | 'ORGANIZATION'

type OnboardingPageProps = {
  onProfileCreated: (profile: UserProfile) => void
}

function OnboardingPage({
  onProfileCreated,
}: OnboardingPageProps) {
  const auth = useAppAuth()

  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('VOLUNTEER')
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
      const profile = await createCurrentUser(auth.accessToken, {
        name,
        email: auth.email,
        role,
      })

      onProfileCreated(profile)
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

  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <h1>Complete your profile</h1>

        <p>
          Your account is ready. Please give us a little more information so
          we can set up your WeVolunteer profile.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <fieldset>
            <legend>Account type</legend>

            <label>
              <input
                type="radio"
                name="role"
                value="VOLUNTEER"
                checked={role === 'VOLUNTEER'}
                onChange={() => setRole('VOLUNTEER')}
              />
              Volunteer
            </label>

            <label>
              <input
                type="radio"
                name="role"
                value="ORGANIZATION"
                checked={role === 'ORGANIZATION'}
                onChange={() => setRole('ORGANIZATION')}
              />
              Organization
            </label>
          </fieldset>

          {errorMessage && <p role="alert">{errorMessage}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating profile...' : 'Create profile'}
          </button>
        </form>

        <button type="button" onClick={auth.signOut}>
          Sign out
        </button>
      </section>
    </main>
  )
}

export default OnboardingPage