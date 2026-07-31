import type { Registration } from '../../../services/api/registrationService'
import { isPastOpportunityDate } from '../../../utils/isPastOpportunityDate'
import UpcomingRegistrationCard from '../UpcomingRegistrationCard/UpcomingRegistrationCard'
import './UpcomingRegistrationList.css'

type UpcomingRegistrationListProps = {
  registrations: Registration[]
  isLoading?: boolean
  error?: string | null
  maxItems?: number
  onCancel: (opportunityId: string) => void
  cancellingOpportunityId?: string | null
}

function UpcomingRegistrationList({
  registrations,
  isLoading = false,
  error = null,
  maxItems = 3,
  onCancel,
  cancellingOpportunityId = null,
}: UpcomingRegistrationListProps) {
  if (isLoading) {
    return (
      <p role="status" className="upcoming-registration-list-message">
        Loading upcoming opportunities...
      </p>
    )
  }

  if (error) {
    return (
      <p role="alert" className="upcoming-registration-list-message">
        {error}
      </p>
    )
  }

  const upcoming = registrations
    .filter((registration) => !isPastOpportunityDate(registration.date))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, maxItems)

  if (upcoming.length === 0) {
    return (
      <p className="upcoming-registration-list-message">
        You have no upcoming opportunities. Browse opportunities to sign up for one.
      </p>
    )
  }

  return (
    <ul className="upcoming-registration-list">
      {upcoming.map((registration) => (
        <li key={registration.opportunityId}>
          <UpcomingRegistrationCard
            registration={registration}
            onCancel={onCancel}
            isCancelling={cancellingOpportunityId === registration.opportunityId}
          />
        </li>
      ))}
    </ul>
  )
}

export default UpcomingRegistrationList