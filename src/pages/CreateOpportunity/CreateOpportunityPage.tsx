import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { createOpportunity } from '../../services/api/opportunityService'
import OpportunityForm, {
  type OpportunityFormSubmitValues,
} from '../../components/organization/OpportunityForm/OpportunityForm'
import './CreateOpportunityPage.css'

function CreateOpportunityPage() {
  const navigate = useNavigate()
  const auth = useAppAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(values: OpportunityFormSubmitValues) {
    if (!auth.accessToken) {
      setSubmitError('Your authentication session is unavailable.')
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await createOpportunity(auth.accessToken, {
        opportunityId: crypto.randomUUID(),
        ...values,
      })

      navigate('/organization')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to create this opportunity.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    navigate('/organization')
  }

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

      <OpportunityForm
        submitLabel="Create Opportunity"
        isSubmitting={isSubmitting}
        submitError={submitError}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </main>
  )
}

export default CreateOpportunityPage
