import { Link } from 'react-router-dom'
import { EditIcon } from '../../shared/icons'
import type { Opportunity } from '../../../types/Opportunity'
import { formatOpportunityTimeRange } from '../../../utils/formatOpportunityTimeRange'
import { formatOpportunityDate } from '../../../utils/formatOpportunityDate'
import { isPastOpportunityDate } from '../../../utils/isPastOpportunityDate'
import { getOpportunityDisplayStatus } from '../../../utils/getOpportunityDisplayStatus'
import './OrganizationOpportunitiesTable.css'

type OrganizationOpportunitiesTableProps = {
  opportunities: Opportunity[]
  isLoading?: boolean
  error?: string | null
  onCloseOpportunity: (opportunityId: string) => void
  closingOpportunityId?: string | null
  onDeleteOpportunity: (opportunityId: string) => void
  deletingOpportunityId?: string | null
  onReopenOpportunity?: (opportunityId: string) => void
  reopeningOpportunityId?: string | null
  emptyMessage?: string
}

function OrganizationOpportunitiesTable({
  opportunities,
  isLoading = false,
  error = null,
  onCloseOpportunity,
  closingOpportunityId = null,
  onDeleteOpportunity,
  deletingOpportunityId = null,
  onReopenOpportunity = () => {},
  reopeningOpportunityId = null,
  emptyMessage = 'You have not created any opportunities yet.',
}: OrganizationOpportunitiesTableProps) {
  if (isLoading) {
    return (
      <p role="status" className="organization-opportunities-table-message">
        Loading opportunities...
      </p>
    )
  }

  if (error) {
    return (
      <p role="alert" className="organization-opportunities-table-message">
        {error}
      </p>
    )
  }

  if (opportunities.length === 0) {
    return <p className="organization-opportunities-table-message">{emptyMessage}</p>
  }

  return (
    <div className="organization-opportunities-table-container">
      <table className="organization-opportunities-table">
        <colgroup>
          <col className="organization-opportunities-col-opportunity" />
          <col className="organization-opportunities-col-date" />
          <col className="organization-opportunities-col-time" />
          <col className="organization-opportunities-col-registrations" />
          <col className="organization-opportunities-col-status" />
          <col className="organization-opportunities-col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Opportunity</th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Registrations</th>
            <th scope="col" className="organization-opportunities-status-header">
              Status
            </th>
            <th scope="col" className="organization-opportunities-actions-header">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity) => {
            const isClosing = closingOpportunityId === opportunity.opportunityId
            const isDeleting = deletingOpportunityId === opportunity.opportunityId
            const isReopening = reopeningOpportunityId === opportunity.opportunityId
            const isPast = isPastOpportunityDate(opportunity.date)
            const displayTime = formatOpportunityTimeRange(
              opportunity.startTime,
              opportunity.endTime,
              opportunity.time,
            )

            const displayStatus = getOpportunityDisplayStatus(opportunity)
            const statusLabel =
              displayStatus === 'COMPLETED' ? 'Completed' : displayStatus === 'OPEN' ? 'Open' : 'Closed'
            const statusModifier = displayStatus.toLowerCase()

            return (
              <tr key={opportunity.opportunityId}>
                <td data-label="Opportunity">
                  <div className="organization-opportunities-table-title-cell">
                    <Link
                      to={`/organization/opportunities/${opportunity.opportunityId}`}
                      className="organization-opportunities-table-title"
                    >
                      {opportunity.title}
                    </Link>
                    {!isPast && (
                      <Link
                        to={`/organization/opportunities/${opportunity.opportunityId}/edit`}
                        className="organization-opportunities-table-edit-link"
                        aria-label={`Edit ${opportunity.title}`}
                      >
                        <EditIcon
                          aria-hidden="true"
                          className="organization-opportunities-table-edit-icon"
                        />
                      </Link>
                    )}
                  </div>
                </td>
                <td data-label="Date">{formatOpportunityDate(opportunity.date)}</td>
                <td data-label="Time">{displayTime}</td>
                <td data-label="Registrations">
                  {opportunity.registeredCount} / {opportunity.capacity}
                </td>
                <td data-label="Status" className="organization-opportunities-status-cell">
                  <span
                    className={`organization-opportunities-status-badge organization-opportunities-status-badge-${statusModifier}`}
                  >
                    {statusLabel}
                  </span>
                </td>
                <td data-label="Actions" className="organization-opportunities-actions-cell">
                  {displayStatus === 'COMPLETED' ? (
                    <Link
                      to={`/organization/opportunities/${opportunity.opportunityId}`}
                      className="organization-opportunities-action-button"
                    >
                      View
                    </Link>
                  ) : displayStatus === 'OPEN' ? (
                    <button
                      type="button"
                      className="organization-opportunities-action-button"
                      disabled={isClosing}
                      onClick={() => onCloseOpportunity(opportunity.opportunityId)}
                    >
                      {isClosing ? 'Closing...' : 'Close'}
                    </button>
                  ) : !isPast ? (
                    <div className="organization-opportunities-actions">
                      <button
                        type="button"
                        className="organization-opportunities-action-button organization-opportunities-reopen-button"
                        disabled={isReopening}
                        onClick={() => onReopenOpportunity(opportunity.opportunityId)}
                      >
                        {isReopening ? 'Reopening...' : 'Reopen'}
                      </button>
                      {opportunity.registeredCount === 0 && (
                        <button
                          type="button"
                          className="organization-opportunities-action-button organization-opportunities-delete-button"
                          disabled={isDeleting}
                          onClick={() => onDeleteOpportunity(opportunity.opportunityId)}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  ) : opportunity.registeredCount === 0 ? (
                    <button
                      type="button"
                      className="organization-opportunities-action-button organization-opportunities-delete-button"
                      disabled={isDeleting}
                      onClick={() => onDeleteOpportunity(opportunity.opportunityId)}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default OrganizationOpportunitiesTable
