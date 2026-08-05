import { Link } from 'react-router-dom'
import type { Opportunity } from '../../../types/Opportunity'
import type { Registration } from '../../../services/api/registrationService'
import type { Waitlist } from '../../../services/api/waitlistService'
import { getOpportunityDisplayStatus } from '../../../utils/getOpportunityDisplayStatus'
import { sortRegistrations } from '../../../utils/sortRegistrations'
import { formatOpportunityDate } from '../../../utils/formatOpportunityDate'
import { formatOpportunityTimeRange } from '../../../utils/formatOpportunityTimeRange'
import { getVolunteerInitial } from '../../../utils/getVolunteerInitial'
import './OrganizationRegistrationGroup.css'

type OrganizationRegistrationGroupProps = {
  opportunity: Opportunity
  registrations: Registration[]
  isLoading?: boolean
  error?: string | null
  waitlist?: Waitlist[]
  isWaitlistLoading?: boolean
  waitlistError?: string | null
}

function formatRegisteredAt(registeredAt: string): string | null {
  const date = new Date(registeredAt)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatJoinedAt(joinedAt: string): string | null {
  const date = new Date(joinedAt)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getVolunteerDisplayName(volunteerName: string | null): string {
  return volunteerName || 'Volunteer'
}

/** Turns a raw status like "ACTIVE" or "NO_SHOW" into a readable "Active" / "No show". */
function formatRegistrationStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/_/g, ' ')

  if (!normalized) {
    return 'Unknown'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function OrganizationRegistrationGroup({
  opportunity,
  registrations,
  isLoading = false,
  error = null,
  waitlist = [],
  isWaitlistLoading = false,
  waitlistError = null,
}: OrganizationRegistrationGroupProps) {
  const displayStatus = getOpportunityDisplayStatus(opportunity)
  const statusLabel =
    displayStatus === 'COMPLETED' ? 'Completed' : displayStatus === 'OPEN' ? 'Open' : 'Closed'
  const statusModifier = displayStatus.toLowerCase()
  const displayTime = formatOpportunityTimeRange(
    opportunity.startTime,
    opportunity.endTime,
    opportunity.time,
  )
  const dateTimeParts = [formatOpportunityDate(opportunity.date)]

  if (displayTime) {
    dateTimeParts.push(displayTime)
  }

  const sortedRegistrations = sortRegistrations(registrations)
  const progressPercent =
    opportunity.capacity > 0
      ? Math.min(100, Math.round((opportunity.registeredCount / opportunity.capacity) * 100))
      : 0

  const sendReminderHintId = `send-reminder-hint-${opportunity.opportunityId}`
  const exportCsvHintId = `export-csv-hint-${opportunity.opportunityId}`

  return (
    <article className="organization-registration-group" aria-label={opportunity.title}>
      <div className="organization-registration-group-header">
        <div className="organization-registration-group-heading">
          <h3 className="organization-registration-group-title">{opportunity.title}</h3>
          <span
            className={`organization-registration-group-status-badge organization-registration-group-status-badge-${statusModifier}`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="organization-registration-group-datetime">
          {dateTimeParts.join(' · ')}
        </p>
      </div>

      <div className="organization-registration-group-count">
        <p className="organization-registration-group-count-text">
          {opportunity.registeredCount} / {opportunity.capacity} registered
        </p>
        <div
          className="organization-registration-group-progress"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${opportunity.title} registration progress`}
        >
          <div
            className="organization-registration-group-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isLoading && (
        <p role="status" className="organization-registration-group-message">
          Loading registered volunteers...
        </p>
      )}

      {!isLoading && error && (
        <p role="alert" className="organization-registration-group-message">
          {error}
        </p>
      )}

      {!isLoading &&
        !error &&
        (sortedRegistrations.length === 0 ? (
          <p className="organization-registration-group-message">
            No volunteers have registered yet.
          </p>
        ) : (
          <div className="organization-registration-group-volunteer-list-container">
            <ul className="organization-registration-group-volunteer-list">
              {sortedRegistrations.map((registration) => {
                const registeredAtLabel = formatRegisteredAt(registration.registeredAt)
                const displayName = getVolunteerDisplayName(registration.volunteerName)
                const initial = getVolunteerInitial(displayName)
                const statusLabel = formatRegistrationStatusLabel(
                  registration.registrationStatus,
                )
                const isActiveStatus = registration.registrationStatus.trim().toUpperCase() === 'ACTIVE'

                return (
                  <li
                    key={registration.userId}
                    className="organization-registration-group-volunteer"
                  >
                    <div className="organization-registration-group-volunteer-primary">
                      <span
                        className="organization-registration-group-volunteer-avatar"
                        aria-hidden="true"
                      >
                        {initial}
                      </span>
                      <div className="organization-registration-group-volunteer-info">
                        <p className="organization-registration-group-volunteer-name">
                          {displayName}
                        </p>
                        {registration.email && (
                          <a
                            href={`mailto:${registration.email}`}
                            className="organization-registration-group-volunteer-email"
                          >
                            {registration.email}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="organization-registration-group-volunteer-meta">
                      {registeredAtLabel && (
                        <p className="organization-registration-group-volunteer-registered-at">
                          Registered {registeredAtLabel}
                        </p>
                      )}
                      <span
                        className={`organization-registration-group-volunteer-status organization-registration-group-volunteer-status-${
                          isActiveStatus ? 'active' : 'other'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

      <div className="organization-registration-group-waitlist">
        <div className="organization-registration-group-waitlist-label">
          <span className="organization-registration-group-waitlist-dot" aria-hidden="true" />
          <span>Waiting List{waitlist.length > 0 ? ` (${waitlist.length})` : ''}</span>
        </div>

        {isWaitlistLoading && (
          <p role="status" className="organization-registration-group-message">
            Loading waiting list...
          </p>
        )}

        {!isWaitlistLoading && waitlistError && (
          <p role="alert" className="organization-registration-group-message">
            {waitlistError}
          </p>
        )}

        {!isWaitlistLoading &&
          !waitlistError &&
          (waitlist.length === 0 ? (
            <p className="organization-registration-group-message">
              No one is on the waiting list.
            </p>
          ) : (
            <div className="organization-registration-group-waitlist-list-container">
              <ul className="organization-registration-group-waitlist-list">
                {waitlist.map((entry, index) => {
                  const joinedAtLabel = formatJoinedAt(entry.joinedAt)
                  const displayName = getVolunteerDisplayName(entry.volunteerName)
                  const initial = getVolunteerInitial(displayName)

                  return (
                    <li
                      key={entry.userId}
                      className="organization-registration-group-waitlist-entry"
                    >
                      <div className="organization-registration-group-waitlist-entry-primary">
                        <span
                          className="organization-registration-group-waitlist-position"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                        <span
                          className="organization-registration-group-volunteer-avatar"
                          aria-hidden="true"
                        >
                          {initial}
                        </span>
                        <div className="organization-registration-group-volunteer-info">
                          <p className="organization-registration-group-volunteer-name">
                            {displayName}
                          </p>
                          {entry.email && (
                            <a
                              href={`mailto:${entry.email}`}
                              className="organization-registration-group-volunteer-email"
                            >
                              {entry.email}
                            </a>
                          )}
                        </div>
                      </div>

                      {joinedAtLabel && (
                        <span className="organization-registration-group-waitlist-entry-meta">
                          Joined {joinedAtLabel}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
      </div>

      <div className="organization-registration-group-actions">
        <div className="organization-registration-group-action">
          <button
            type="button"
            className="organization-registration-group-action-button"
            disabled
            title="Reminder emails are coming soon."
            aria-describedby={sendReminderHintId}
          >
            Send reminder
          </button>
          <p id={sendReminderHintId} className="organization-registration-group-action-hint">
            Reminder emails are coming soon.
          </p>
        </div>

        <div className="organization-registration-group-action">
          <button
            type="button"
            className="organization-registration-group-action-button"
            disabled
            title="CSV export is coming soon."
            aria-describedby={exportCsvHintId}
          >
            Export CSV
          </button>
          <p id={exportCsvHintId} className="organization-registration-group-action-hint">
            CSV export is coming soon.
          </p>
        </div>

        <Link
          to={`/organization/opportunities/${opportunity.opportunityId}`}
          className="organization-registration-group-view-link"
        >
          View Opportunity
        </Link>
      </div>
    </article>
  )
}

export default OrganizationRegistrationGroup
