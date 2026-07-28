import type { Opportunity } from '../../../types/Opportunity'
import OpportunityListItem from '../OpportunityListItem/OpportunityListItem'
import './OpportunitiesListView.css'

type OpportunitiesListViewProps = {
  opportunities: Opportunity[]
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  onRegister?: (opportunityId: string) => Promise<void>
}

function OpportunitiesListView({
  opportunities,
  isLoading = false,
  error = null,
  emptyMessage = 'No opportunities match your search yet. Try adjusting your filters.',
  onRegister,
}: OpportunitiesListViewProps) {
  if (isLoading) {
    return (
      <p role="status" className="opportunities-list-view-message">
        Loading opportunities...
      </p>
    )
  }

  if (error) {
    return (
      <p role="alert" className="opportunities-list-view-message">
        {error}
      </p>
    )
  }

  if (opportunities.length === 0) {
    return (
      <p className="opportunities-list-view-message">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="opportunities-list-view">
      {opportunities.map((opportunity) => (
        <li key={opportunity.opportunityId}>
          <OpportunityListItem opportunity={opportunity} onRegister={onRegister} />
        </li>
      ))}
    </ul>
  )
}

export default OpportunitiesListView