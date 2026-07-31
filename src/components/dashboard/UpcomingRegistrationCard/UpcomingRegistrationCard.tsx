import { Link } from 'react-router-dom'
import type { Registration } from '../../../services/api/registrationService'
import { formatOpportunityDate } from '../../../utils/formatOpportunityDate'
import { formatOpportunityTimeRange } from '../../../utils/formatOpportunityTimeRange'
import './UpcomingRegistrationCard.css'

type UpcomingRegistrationCardProps = {
  registration: Registration
  onCancel: (opportunityId: string) => void
  isCancelling: boolean
}

function UpcomingRegistrationCard({
  registration,
  onCancel,
  isCancelling,
}: UpcomingRegistrationCardProps) {
  const displayTime = formatOpportunityTimeRange(
    registration.startTime,
    registration.endTime,
    registration.time,
  )

  return (
    <article className="upcoming-registration-card">
      <Link
        to={`/opportunities/${registration.opportunityId}`}
        className="upcoming-registration-card-stretched-link"
        aria-label={`View ${registration.title}`}
      />

      <div className="upcoming-registration-card-image-placeholder" aria-hidden="true" />

      <div className="upcoming-registration-card-content">
        <p className="upcoming-registration-card-title">{registration.title}</p>
        <p className="upcoming-registration-card-org">{registration.organizationName}</p>

        <div className="upcoming-registration-card-meta">
          <span>{formatOpportunityDate(registration.date)}</span>
          {displayTime && <span>{displayTime}</span>}
        </div>
      </div>

      <button
        type="button"
        className="upcoming-registration-card-cancel-button"
        disabled={isCancelling}
        onClick={() => onCancel(registration.opportunityId)}
      >
        {isCancelling ? 'Cancelling...' : 'Cancel registration'}
      </button>
    </article>
  )
}

export default UpcomingRegistrationCard