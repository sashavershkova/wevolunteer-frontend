import { Link } from 'react-router-dom'
import './CreateOpportunityPage.css'

function CreateOpportunityPage() {
  return (
    <main className="create-opportunity-page">
      <Link to="/organization" className="create-opportunity-back-link">
        &larr; Back to Dashboard
      </Link>

      <header className="create-opportunity-header">
        <h1>Create Opportunity</h1>
        <p className="create-opportunity-subtitle">
          Add a new volunteer opportunity for your organization.
        </p>
      </header>
    </main>
  )
}

export default CreateOpportunityPage
