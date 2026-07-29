import { Link } from 'react-router-dom'
import { EditIcon } from '../../shared/icons'
import type { Opportunity } from '../../../types/Opportunity'
import './OrganizationOpportunitiesTable.css'

type OrganizationOpportunitiesTableProps = {
  opportunities: Opportunity[]
  isLoading?: boolean
  error?: string | null
  onCloseOpportunity: (opportunityId: string) => void
  closingOpportunityId?: string | null
}

function formatEventDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function OrganizationOpportunitiesTable({
  opportunities,
  isLoading = false,
  error = null,
  onCloseOpportunity,
  closingOpportunityId = null,
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
    return (
      <p className="organization-opportunities-table-message">
        You have not created any opportunities yet.
      </p>
    )
  }

  return (
    <div className="organization-opportunities-table-container">
      <table className="organization-opportunities-table">
        <thead>
          <tr>
            <th scope="col">Opportunity</th>
            <th scope="col">Date</th>
            <th scope="col">Registrations</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity) => {
            const isClosing = closingOpportunityId === opportunity.opportunityId

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
                  </div>
                </td>
                <td data-label="Date">{formatEventDate(opportunity.date)}</td>
                <td data-label="Registrations">
                  {opportunity.registeredCount} / {opportunity.capacity}
                </td>
                <td data-label="Status">
                  <span
                    className={`organization-opportunities-status-badge organization-opportunities-status-badge-${opportunity.status.toLowerCase()}`}
                  >
                    {opportunity.status === 'OPEN' ? 'Open' : 'Closed'}
                  </span>
                </td>
                <td data-label="Actions">
                  {opportunity.status === 'OPEN' ? (
                    <button
                      type="button"
                      className="organization-opportunities-close-button"
                      disabled={isClosing}
                      onClick={() => onCloseOpportunity(opportunity.opportunityId)}
                    >
                      {isClosing ? 'Closing...' : 'Close'}
                    </button>
                  ) : (
                    <span className="organization-opportunities-no-action">—</span>
                  )}
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
