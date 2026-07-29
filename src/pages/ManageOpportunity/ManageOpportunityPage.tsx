import { Link, useParams } from 'react-router-dom'
import './ManageOpportunityPage.css'

function ManageOpportunityPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>()

  return (
    <main className="manage-opportunity-page">
      <Link to="/organization" className="manage-opportunity-back-link">
        &larr; Back to Dashboard
      </Link>

      <header className="manage-opportunity-header">
        <h1>Edit Opportunity</h1>
        <p className="manage-opportunity-subtitle">
          Opportunity ID: {opportunityId}
        </p>
      </header>

      <p className="manage-opportunity-placeholder-note">
        Editing is not implemented yet. This page is the navigation target for
        the opportunity edit flow.
      </p>
    </main>
  )
}

export default ManageOpportunityPage
