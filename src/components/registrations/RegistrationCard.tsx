import { Link } from 'react-router-dom'
import type { Registration } from '../../services/api/registrationService'
import { formatOpportunityTimeRange } from '../../utils/formatOpportunityTimeRange'
import { isPastOpportunityDate } from '../../utils/isPastOpportunityDate'
import './RegistrationCard.css'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Registered',
}

function formatStatus(status: string): string {
  const knownLabel = STATUS_LABELS[status]

  if (knownLabel) {
    return knownLabel
  }

  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

type RegistrationCardProps = {
  registration: Registration
  onCancel: (opportunityId: string) => void
  isCancelling: boolean
}

function RegistrationCard({
  registration,
  onCancel,
  isCancelling,
}: RegistrationCardProps) {
  const displayTime =
    formatOpportunityTimeRange(
      registration.startTime,
      registration.endTime,
      registration.time,
    ) ?? 'Time not provided'

  const isCompleted = isPastOpportunityDate(registration.date)
  const statusLabel = isCompleted
    ? 'Completed'
    : formatStatus(registration.registrationStatus)

  return (
    <article className="registration-card">
      <Link
        to={`/opportunities/${registration.opportunityId}`}
        className="registration-card-stretched-link"
        aria-label={`View details for ${registration.title}`}
      />

      <div className="registration-card-main">
        <h2 className="registration-card-title">{registration.title}</h2>
        <p className="registration-card-organization">
          {registration.organizationName}
        </p>

        <dl className="registration-card-meta">
          <div className="registration-card-meta-item">
            <dt>Date</dt>
            <dd>{registration.date}</dd>
          </div>
          <div className="registration-card-meta-item">
            <dt>Time</dt>
            <dd>{displayTime}</dd>
          </div>
          <div className="registration-card-meta-item">
            <dt>Location</dt>
            <dd>{registration.location}</dd>
          </div>
        </dl>
      </div>

      <div className="registration-card-status">
        <span
          className={
            isCompleted
              ? 'registration-status-badge registration-status-badge-completed'
              : 'registration-status-badge'
          }
        >
          {statusLabel}
        </span>

        {!isCompleted && (
          <button
            type="button"
            className="registration-cancel-button"
            disabled={isCancelling}
            onClick={() => onCancel(registration.opportunityId)}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Registration'}
          </button>
        )}
      </div>
    </article>
  )
}

export default RegistrationCard
