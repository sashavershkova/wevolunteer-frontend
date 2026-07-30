import { Link } from 'react-router-dom'
import type { Opportunity } from '../../../types/Opportunity'
import { getOpportunityDisplayStatus } from '../../../utils/getOpportunityDisplayStatus'
import { sortOrganizationOpportunities } from '../../../utils/sortOrganizationOpportunities'
import { formatOpportunityDate } from '../../../utils/formatOpportunityDate'
import { formatOpportunityTimeRange } from '../../../utils/formatOpportunityTimeRange'
import './UpcomingOpportunityList.css'

type UpcomingOpportunityListProps = {
  opportunities: Opportunity[]
  isLoading?: boolean
  error?: string | null
  maxItems?: number
}

function UpcomingOpportunityList({
  opportunities,
  isLoading = false,
  error = null,
  maxItems = 3,
}: UpcomingOpportunityListProps) {
  if (isLoading) {
    return (
      <p role="status" className="upcoming-opportunity-list-message">
        Loading upcoming opportunities...
      </p>
    )
  }

  if (error) {
    return (
      <p role="alert" className="upcoming-opportunity-list-message">
        {error}
      </p>
    )
  }

  const upcoming = sortOrganizationOpportunities(
    opportunities.filter((opportunity) => getOpportunityDisplayStatus(opportunity) === 'OPEN'),
  ).slice(0, maxItems)

  if (upcoming.length === 0) {
    return (
      <div className="upcoming-opportunity-list-empty">
        <p className="upcoming-opportunity-list-message">
          You have no upcoming opportunities.
        </p>
        <Link
          to="/organization/opportunities/new"
          className="upcoming-opportunity-list-create-link"
        >
          Create your first opportunity
        </Link>
      </div>
    )
  }

  return (
    <ul className="upcoming-opportunity-list">
      {upcoming.map((opportunity) => {
        const displayTime = formatOpportunityTimeRange(
          opportunity.startTime,
          opportunity.endTime,
          opportunity.time,
        )
        const metaParts = [formatOpportunityDate(opportunity.date)]

        if (displayTime) {
          metaParts.push(displayTime)
        }

        metaParts.push(`${opportunity.registeredCount} / ${opportunity.capacity} registered`)

        return (
          <li key={opportunity.opportunityId} className="upcoming-opportunity-list-item">
            <div className="upcoming-opportunity-list-item-main">
              <Link
                to={`/organization/opportunities/${opportunity.opportunityId}`}
                className="upcoming-opportunity-list-item-title"
              >
                {opportunity.title}
              </Link>
              <p className="upcoming-opportunity-list-item-meta">{metaParts.join(' · ')}</p>
            </div>
            <Link
              to={`/organization/opportunities/${opportunity.opportunityId}`}
              className="upcoming-opportunity-list-item-view-link"
            >
              View
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default UpcomingOpportunityList
