import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { getOpportunity, updateOpportunity } from '../../services/api/opportunityService'
import OpportunityForm, {
  type OpportunityFormSubmitValues,
} from '../../components/organization/OpportunityForm/OpportunityForm'
import type { Opportunity } from '../../types/Opportunity'
import './ManageOpportunityPage.css'

function ManageOpportunityPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>()
  const navigate = useNavigate()
  const auth = useAppAuth()

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    const loadOpportunity = async () => {
      if (!opportunityId) {
        setIsLoading(false)
        setLoadError('No opportunity was specified.')
        return
      }

      if (!auth.accessToken) {
        setIsLoading(false)
        setLoadError('Your authentication session is unavailable.')
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await getOpportunity(auth.accessToken, opportunityId)

        if (ignore) {
          return
        }

        if (!result) {
          setLoadError('This opportunity could not be found.')
          setOpportunity(null)
          return
        }

        setOpportunity(result)
      } catch (error) {
        if (!ignore) {
          setLoadError(
            error instanceof Error ? error.message : 'Unable to load this opportunity.',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadOpportunity()

    return () => {
      ignore = true
    }
  }, [opportunityId, auth.accessToken])

  async function handleSubmit(values: OpportunityFormSubmitValues) {
    if (!opportunity || !opportunityId) {
      return
    }

    if (!auth.accessToken) {
      setSubmitError('Your authentication session is unavailable.')
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await updateOpportunity(auth.accessToken, opportunityId, {
        ...values,
        status: opportunity.status,
        whatYoullDo: opportunity.whatYoullDo,
        recurring: opportunity.recurring,
      })

      navigate('/organization')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to update this opportunity.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    navigate('/organization')
  }

  if (auth.isProfileLoading) {
    return (
      <main>
        <h1>Loading your profile...</h1>
      </main>
    )
  }

  if (auth.profileErrorMessage) {
    return (
      <main>
        <h1>Unable to load your profile</h1>
        <p>{auth.profileErrorMessage}</p>
      </main>
    )
  }

  if (auth.organizationProfile === null) {
    return <Navigate to="/" replace />
  }

  const organization = auth.organizationProfile
  const isOwner = opportunity !== null && opportunity.organizationId === organization.organizationId

  return (
    <main className="manage-opportunity-page">
      <Link to="/organization" className="manage-opportunity-back-link">
        &larr; Back to Dashboard
      </Link>

      <header className="manage-opportunity-header">
        <h1>Edit Opportunity</h1>
      </header>

      {isLoading && (
        <p role="status" className="manage-opportunity-status">
          Loading opportunity...
        </p>
      )}

      {!isLoading && loadError && (
        <p role="alert" className="manage-opportunity-error">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && opportunity && !isOwner && (
        <p role="alert" className="manage-opportunity-error">
          Your organization cannot edit this opportunity.
        </p>
      )}

      {!isLoading && !loadError && opportunity && isOwner && (
        <OpportunityForm
          initialValues={{
            title: opportunity.title,
            description: opportunity.description,
            category: opportunity.category,
            location: opportunity.location,
            date: opportunity.date,
            capacity: opportunity.capacity,
            startTime: opportunity.startTime,
            endTime: opportunity.endTime,
          }}
          submitLabel="Save Changes"
          isSubmitting={isSubmitting}
          submitError={submitError}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  )
}

export default ManageOpportunityPage
