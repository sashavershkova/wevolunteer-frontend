import type { OrganizationVolunteer } from '../../../utils/aggregateOrganizationVolunteers'
import { getVolunteerInitial } from '../../../utils/getVolunteerInitial'
import { formatRegisteredAtDate } from '../../../utils/formatRegisteredAtDate'
import './OrganizationVolunteerCard.css'

type OrganizationVolunteerCardProps = {
  volunteer: OrganizationVolunteer
}

const STATUS_LABELS = {
  NEW: 'New Volunteer',
  RETURNING: 'Returning Volunteer',
  FREQUENT: 'Frequent Volunteer',
} as const

function OrganizationVolunteerCard({ volunteer }: OrganizationVolunteerCardProps) {
  const initial = getVolunteerInitial(volunteer.name)
  const statusLabel = STATUS_LABELS[volunteer.status]
  const statusModifier = volunteer.status.toLowerCase()
  const firstRegisteredLabel = formatRegisteredAtDate(volunteer.firstRegisteredAt)
  const mostRecentRegisteredLabel = formatRegisteredAtDate(volunteer.mostRecentRegisteredAt)

  return (
    <article className="organization-volunteer-card" aria-label={volunteer.name}>
      <div className="organization-volunteer-card-primary">
        <span className="organization-volunteer-card-avatar" aria-hidden="true">
          {initial}
        </span>
        <div className="organization-volunteer-card-info">
          <p className="organization-volunteer-card-name">{volunteer.name}</p>
          {volunteer.email && (
            <a
              href={`mailto:${volunteer.email}`}
              className="organization-volunteer-card-email"
            >
              {volunteer.email}
            </a>
          )}
        </div>
      </div>

      <span
        className={`organization-volunteer-card-status-badge organization-volunteer-card-status-badge-${statusModifier}`}
      >
        {statusLabel}
      </span>

      <div className="organization-volunteer-card-counts">
        <p className="organization-volunteer-card-count">
          {volunteer.registrationCount} {volunteer.registrationCount === 1 ? 'registration' : 'registrations'}
        </p>
        <p className="organization-volunteer-card-count organization-volunteer-card-count-upcoming">
          {volunteer.upcomingRegistrationCount} upcoming
        </p>
      </div>

      <div className="organization-volunteer-card-dates">
        <p className="organization-volunteer-card-date">
          First registered {firstRegisteredLabel ?? '—'}
        </p>
        <p className="organization-volunteer-card-date">
          Most recent {mostRecentRegisteredLabel ?? '—'}
        </p>
      </div>
    </article>
  )
}

export default OrganizationVolunteerCard
