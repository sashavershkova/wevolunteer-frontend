import { useEffect, useState } from 'react'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'

function MyRegistrationsPage() {
  const auth = useAppAuth()

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.accessToken) {
      setIsLoading(false)
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
      <main>
        <p>Loading registrations...</p>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main>
        <p>{errorMessage}</p>
      </main>
    )
  }

  if (registrations.length === 0) {
    return (
      <main>
        <p>You have no registrations yet.</p>
      </main>
    )
  }

  return (
    <main>
      <ul>
        {registrations.map((registration) => (
          <li key={registration.opportunityId}>
            <p>{registration.title}</p>
            <p>{registration.organizationName}</p>
            <p>{registration.date}</p>
            <p>{registration.location}</p>
            <p>{registration.registrationStatus}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default MyRegistrationsPage
