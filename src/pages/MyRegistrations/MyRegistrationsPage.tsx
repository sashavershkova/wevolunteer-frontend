import { useEffect, useState } from 'react'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'
import RegistrationCard from '../../components/registrations/RegistrationCard'
import './MyRegistrationsPage.css'

function MyRegistrationsPage() {
  const auth = useAppAuth()

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(auth.accessToken))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.accessToken) {
      return
    }

    let ignore = false

    const loadRegistrations = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const result = await getMyRegistrations(auth.accessToken)

        if (!ignore) {
          setRegistrations(result)
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load registrations',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadRegistrations()

    return () => {
      ignore = true
    }
  }, [auth.accessToken])

  if (isLoading) {
    return (
      <main className="my-registrations-page">
        <h1>My Registrations</h1>
        <p>Loading registrations...</p>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="my-registrations-page">
        <h1>My Registrations</h1>
        <p>{errorMessage}</p>
      </main>
    )
  }

  if (registrations.length === 0) {
    return (
      <main className="my-registrations-page">
        <h1>My Registrations</h1>
        <p>You have no registrations yet.</p>
      </main>
    )
  }

  return (
    <main className="my-registrations-page">
      <h1>My Registrations</h1>
      <p className="my-registrations-subtitle">
        View and manage the volunteer opportunities you have joined.
      </p>

      <ul className="my-registrations-list">
        {registrations.map((registration) => (
          <li key={registration.opportunityId}>
            <RegistrationCard registration={registration} />
          </li>
        ))}
      </ul>
    </main>
  )
}

export default MyRegistrationsPage
