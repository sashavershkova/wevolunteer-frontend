import type { Registration } from '../../services/api/registrationService'
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
}

function RegistrationCard({ registration }: RegistrationCardProps) {
  return (
    <article className="registration-card">
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
            <dt>Location</dt>
            <dd>{registration.location}</dd>
          </div>
        </dl>
      </div>

      <div className="registration-card-status">
        <span className="registration-status-badge">
          {formatStatus(registration.registrationStatus)}
        </span>
      </div>
    </article>
  )
}

export default RegistrationCard
