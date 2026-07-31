import type { Opportunity } from '../../../types/Opportunity'
import OpportunityListItem from '../OpportunityListItem/OpportunityListItem'
import './OpportunitiesListView.css'

type OpportunitiesListViewProps = {
  opportunities: Opportunity[]
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  onRegister?: (opportunityId: string) => Promise<void>
  favoritedOpportunityIds?: Set<string>
  onToggleFavorite?: (opportunityId: string) => Promise<void>
  registeredOpportunityIds?: Set<string>
  onCancelRegistration?: (opportunityId: string) => Promise<void>
}

function OpportunitiesListView({
  opportunities,
  isLoading = false,
  error = null,
  emptyMessage = 'No opportunities match your search yet. Try adjusting your filters.',
  onRegister,
  favoritedOpportunityIds,
  onToggleFavorite,
  registeredOpportunityIds,
  onCancelRegistration,
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
          <OpportunityListItem
            opportunity={opportunity}
            onRegister={onRegister}
            isFavorited={favoritedOpportunityIds?.has(opportunity.opportunityId)}
            onToggleFavorite={onToggleFavorite}
            isRegistered={registeredOpportunityIds?.has(opportunity.opportunityId)}
            onCancelRegistration={onCancelRegistration}
          />
        </li>
      ))}
    </ul>
  )
}

export default OpportunitiesListView