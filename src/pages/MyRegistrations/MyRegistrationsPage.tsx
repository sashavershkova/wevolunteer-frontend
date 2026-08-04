import { useEffect, useMemo, useState } from 'react'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  cancelMyRegistration,
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'
import RegistrationCard from '../../components/registrations/RegistrationCard'
import VolunteerRegistrationFilters from '../../components/registrations/VolunteerRegistrationFilters/VolunteerRegistrationFilters'
import {
  EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
  filterVolunteerRegistrations,
  type VolunteerRegistrationFiltersValue,
} from '../../utils/volunteerRegistrationFilters'
import './MyRegistrationsPage.css'

function MyRegistrationsPage() {
  const auth = useAppAuth()

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(auth.accessToken))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cancellingOpportunityId, setCancellingOpportunityId] =
    useState<string | null>(null)
  const [cancellationErrorMessage, setCancellationErrorMessage] =
    useState<string | null>(null)
  const [filters, setFilters] = useState<VolunteerRegistrationFiltersValue>(
    EMPTY_VOLUNTEER_REGISTRATION_FILTERS,
  )

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

  const handleCancelRegistration = async (opportunityId: string) => {
    if (!auth.accessToken) {
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel this registration?',
    )

    if (!confirmed) {
      return
    }

    setCancellationErrorMessage(null)
    setCancellingOpportunityId(opportunityId)

    try {
      await cancelMyRegistration(auth.accessToken, opportunityId)

      setRegistrations((current) =>
        current.filter(
          (registration) => registration.opportunityId !== opportunityId,
        ),
      )
    } catch (error) {
      setCancellationErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to cancel registration',
      )
    } finally {
      setCancellingOpportunityId(null)
    }
  }

  const filteredRegistrations = useMemo(
    () => filterVolunteerRegistrations(registrations, filters),
    [registrations, filters],
  )

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

  const sortedRegistrations = [...filteredRegistrations].sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  return (
    <main className="my-registrations-page">
      <h1>My Registrations</h1>
      <p className="my-registrations-subtitle">
        View and manage the volunteer opportunities you have joined.
      </p>

      {cancellationErrorMessage && (
        <p role="alert" className="my-registrations-error">
          {cancellationErrorMessage}
        </p>
      )}

      <VolunteerRegistrationFilters
        registrations={registrations}
        value={filters}
        onChange={setFilters}
      />

      {sortedRegistrations.length === 0 ? (
        <p className="my-registrations-empty-filtered">
          No registrations match your search yet. Try adjusting your filters.
        </p>
      ) : (
        <ul className="my-registrations-list">
          {sortedRegistrations.map((registration) => (
            <li key={registration.opportunityId}>
              <RegistrationCard
                registration={registration}
                onCancel={handleCancelRegistration}
                isCancelling={
                  cancellingOpportunityId === registration.opportunityId
                }
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default MyRegistrationsPage